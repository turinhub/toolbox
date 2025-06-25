"use server"

import { promisify } from 'util';
import { lookup, resolve4, resolve6, resolveMx, resolveNs, resolveTxt, resolveCname } from 'dns';
import https from 'https';
import { TLSSocket } from 'tls';

const lookupAsync = promisify(lookup);
const resolve4Async = promisify(resolve4);
const resolve6Async = promisify(resolve6);
const resolveMxAsync = promisify(resolveMx);
const resolveNsAsync = promisify(resolveNs);
const resolveTxtAsync = promisify(resolveTxt);
const resolveCnameAsync = promisify(resolveCname);

interface DomainBasicInfo {
  status: 'active' | 'inactive' | 'error';
  ipAddress?: string;
  error?: string;
}

interface DnsRecords {
  A?: string[];
  AAAA?: string[];
  CNAME?: string[];
  MX?: string[];
  NS?: string[];
  TXT?: string[];
}

interface SslInfo {
  valid: boolean;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  daysLeft?: number;
  error?: string;
}

interface PerformanceInfo {
  responseTime?: number;
  httpStatus?: number;
  redirects?: string[];
  error?: string;
}

export async function checkDomainBasicInfo(domain: string): Promise<DomainBasicInfo> {
  try {
    const result = await lookupAsync(domain);
    return {
      status: 'active',
      ipAddress: result.address
    };
  } catch (error) {
    console.error('Basic info check failed:', error);
    return {
      status: 'error',
      error: error instanceof Error ? error.message : '域名解析失败'
    };
  }
}

export async function checkDomainDNS(domain: string): Promise<DnsRecords> {
  const records: DnsRecords = {};

  try {
    // A 记录
    try {
      const aRecords = await resolve4Async(domain);
      records.A = aRecords;
    } catch {
      console.log('A record not found for', domain);
    }

    // AAAA 记录
    try {
      const aaaaRecords = await resolve6Async(domain);
      records.AAAA = aaaaRecords;
    } catch {
      console.log('AAAA record not found for', domain);
    }

    // CNAME 记录
    try {
      const cnameRecords = await resolveCnameAsync(domain);
      records.CNAME = cnameRecords;
    } catch {
      console.log('CNAME record not found for', domain);
    }

    // MX 记录
    try {
      const mxRecords = await resolveMxAsync(domain);
      records.MX = mxRecords.map(mx => `${mx.priority} ${mx.exchange}`);
    } catch {
      console.log('MX record not found for', domain);
    }

    // NS 记录
    try {
      const nsRecords = await resolveNsAsync(domain);
      records.NS = nsRecords;
    } catch {
      console.log('NS record not found for', domain);
    }

    // TXT 记录
    try {
      const txtRecords = await resolveTxtAsync(domain);
      records.TXT = txtRecords.flat();
    } catch {
      console.log('TXT record not found for', domain);
    }

  } catch (error) {
    console.error('DNS check failed for', domain, error);
  }

  return records;
}

export async function checkDomainSSL(domain: string): Promise<SslInfo> {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      port: 443,
      method: 'HEAD',
      timeout: 10000,
      servername: domain
    };

    const req = https.request(options, (res) => {
      const socket = res.socket as TLSSocket;
      const cert = socket?.getPeerCertificate();
      
      if (cert && Object.keys(cert).length > 0) {
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysLeft = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        resolve({
          valid: now >= validFrom && now <= validTo,
          issuer: cert.issuer?.O || cert.issuer?.CN || '未知',
          validFrom: validFrom.toISOString().split('T')[0],
          validTo: validTo.toISOString().split('T')[0],
          daysLeft: daysLeft
        });
      } else {
        resolve({
          valid: false,
          error: 'SSL证书信息不可用'
        });
      }
    });

    req.on('error', (error) => {
      console.error('SSL check failed:', error);
      resolve({
        valid: false,
        error: error.message || 'SSL检查失败'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        valid: false,
        error: '连接超时'
      });
    });

    req.end();
  });
}

export async function checkDomainPerformance(domain: string): Promise<PerformanceInfo> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Domain-Checker/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        responseTime,
        httpStatus: res.statusCode || 0,
        redirects: res.headers.location ? [res.headers.location] : []
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      console.error('Performance check failed:', error);
      resolve({
        responseTime,
        httpStatus: 0,
        error: error.message || '性能检测失败'
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        responseTime,
        httpStatus: 0,
        error: '连接超时'
      });
    });

    req.end();
  });
}

// 综合检测函数
export async function checkDomainComplete(domain: string) {
  try {
    const [basicInfo, dnsRecords, sslInfo, performanceInfo] = await Promise.all([
      checkDomainBasicInfo(domain),
      checkDomainDNS(domain),
      checkDomainSSL(domain),
      checkDomainPerformance(domain)
    ]);

    return {
      domain,
      basicInfo,
      dnsRecords,
      sslInfo,
      performanceInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Complete domain check failed:', error);
    throw new Error(error instanceof Error ? error.message : '域名检测失败');
  }
} 
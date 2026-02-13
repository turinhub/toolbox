import { _Object as S3Object } from "@aws-sdk/client-s3";

export interface TestResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: S3Object[];
  errorDetails?: Record<string, string>;
}

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  path: string;
  region?: string;
  usePathStyle?: boolean;
}

export type S3Error =
  | import("@aws-sdk/client-s3").S3ServiceException
  | Error
  | unknown;

export interface SavedConfig {
  name: string;
  config: S3Config;
}

export interface CopyState {
  [key: string]: boolean;
}

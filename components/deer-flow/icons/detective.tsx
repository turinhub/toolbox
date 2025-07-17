import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export function Detective({ className, ...props }: React.ComponentProps<"svg">) {
  return <MagnifyingGlassIcon className={className} {...props} />;
}
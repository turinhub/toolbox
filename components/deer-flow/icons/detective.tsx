import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

export function Detective({ className, ...props }: React.ComponentProps<typeof MagnifyingGlassIcon>) {
  return <MagnifyingGlassIcon className={className} {...props} />;
}
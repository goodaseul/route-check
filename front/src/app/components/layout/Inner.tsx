type InnerProps = {
  children: React.ReactNode;
  styles?: string;
};
export default function Inner({ children, styles }: InnerProps) {
  return <div className={`px-6 ${styles}`}>{children}</div>;
}

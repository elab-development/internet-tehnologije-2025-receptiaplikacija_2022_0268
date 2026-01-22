type CardProps = {
    title: string;
    children?: React.ReactNode;
  };
  
  export default function Card({ title, children }: CardProps) {
    return (
      <div className="rounded border bg-white p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="mt-2 text-sm text-gray-700">{children}</div>
      </div>
    );
  }
  
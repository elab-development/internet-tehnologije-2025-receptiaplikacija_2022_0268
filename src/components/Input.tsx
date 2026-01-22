type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
  };
  
  export default function Input({ label, ...props }: InputProps) {
    return (
      <label className="block">
        {label && <span className="mb-1 block text-sm">{label}</span>}
        <input
          {...props}
          className="w-full rounded border px-3 py-2 outline-none focus:ring"
        />
      </label>
    );
  }
  
type ButtonProps = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit";
  };
  
  export default function Button({ children, onClick, type = "button" }: ButtonProps) {
    return (
      <button
        type={type}
        onClick={onClick}
        className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
      >
        {children}
      </button>
    );
  }
  
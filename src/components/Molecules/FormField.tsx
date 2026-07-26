import Input from "../Atoms/Input";
import styles from "./FormField.module.scss";

type FormFieldProps = {
  label: string;
  type: "text" | "email" | "password";
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  placeholder?: string;
  appearance?: "light" | "dark";
};

export default function FormField({
  label,
  type,
  name,
  value,
  onChange,
  error,
  disabled,
  required = false,
  minLength,
  autoComplete,
  placeholder,
  appearance = "light",
}: FormFieldProps) {
  return (
    <div
      className={`${styles.fieldWrapper} ${
        appearance === "dark" ? styles.fullWidth : ""
      }`}
    >
      <label
        className={`${styles.label} ${appearance === "dark" ? styles.darkLabel : ""}`}
        htmlFor={name}
      >
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <Input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        appearance={appearance}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

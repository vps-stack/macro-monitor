import React from "react";
import styles from "./Input.module.scss";

type InputProps = {
  type: "text" | "email" | "password";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  autoComplete?: string;
  appearance?: "light" | "dark";
};

export default function Input({
  type,
  placeholder,
  value,
  onChange,
  name,
  required = false,
  disabled,
  minLength,
  autoComplete,
  appearance = "light",
}: InputProps) {
  return (
    <input
      className={`${styles.input} ${styles[appearance]}`}
      id={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      disabled={disabled}
      minLength={minLength}
      autoComplete={autoComplete}
    />
  );
}

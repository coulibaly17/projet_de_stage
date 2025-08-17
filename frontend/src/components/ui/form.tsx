import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import type { FieldValues, FieldPath } from "react-hook-form";
import { cn } from "@/lib/utils";

// Types pour les props des composants Form
interface FormProps<TFieldValues extends FieldValues = FieldValues> extends React.FormHTMLAttributes<HTMLFormElement> {
  form: ReturnType<typeof useFormContext<TFieldValues>>;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

interface FormFieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: FieldPath<TFieldValues>;
  control?: ReturnType<typeof useFormContext<TFieldValues>>["control"];
  render: (props: { field: any }) => React.ReactElement;
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {}

interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: string;
}

// Composants Form
const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, form, onSubmit, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(className)}
        onSubmit={onSubmit}
        {...props}
      />
    );
  }
);
Form.displayName = "Form";

const FormField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  render,
}: FormFieldProps<TFieldValues>) => {
  return (
    <Controller
      name={name as any}
      control={control as any}
      render={({ field }) => render({ field }) as React.ReactElement}
    />
  );
};
FormField.displayName = "FormField";

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
    );
  }
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn("text-sm font-medium leading-none", className)}
        {...props}
      />
    );
  }
);
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-1", className)}
        {...props}
      />
    );
  }
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-gray-500", className)}
        {...props}
      />
    );
  }
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-red-500", className)}
        {...props}
      >
        {error || children}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
};

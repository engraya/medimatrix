import Image from "next/image";
import ReactDatePicker from "react-datepicker";
import { Control, FieldValues, FieldPath } from "react-hook-form";
import PhoneInput from "react-phone-number-input";

import { Checkbox } from "./ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATE_PICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
}

interface CustomProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTimeSelect?: boolean;
  children?: React.ReactNode;
  renderSkeleton?: (field: any) => React.ReactNode;
  fieldType: FormFieldType;
}

const RenderInput = <T extends FieldValues,>({ field, props }: { field: any; props: CustomProps<T> }) => {
  switch (props.fieldType) {
    case FormFieldType.INPUT:
      return (
        <div className="flex rounded-md border text-gray-200 border-dark-500 bg-dark-300">
          {props.iconSrc && (
            <Image
              src={props.iconSrc}
              height={24}
              width={24}
              alt={props.iconAlt || "icon"}
              className="ml-2"
            />
          )}
          <FormControl>
            <Input
              type={props.name === "email" ? "email" : "text"}
              placeholder={props.placeholder}
              {...field}
              disabled={props.disabled}
              className="shad-input border-0"
            />
          </FormControl>
        </div>
      );
    case FormFieldType.TEXTAREA:
      return (
        <FormControl>
          <Textarea
            placeholder={props.placeholder}
            {...field}
            className="shad-textArea text-gray-200"
            disabled={props.disabled}
          />
        </FormControl>
      );
    case FormFieldType.PHONE_INPUT:
      return (
        <FormControl>
          <PhoneInput
            flagUrl="/assets/flags/{XX}.svg"
            defaultCountry="NG"
            placeholder={props.placeholder}
            international
            withCountryCallingCode
            value={field.value || undefined}
            onChange={value => field.onChange(value ?? "")}
            onBlur={field.onBlur}
            disabled={props.disabled}
            className="input-phone text-gray-400"
          />
        </FormControl>
      );
    case FormFieldType.CHECKBOX:
      return (
        <FormControl>
          <div className="flex items-center gap-4 text-gray-200">
            <Checkbox
              id={props.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label htmlFor={props.name} className="checkbox-label text-gray-200">
              {props.label}
            </label>
          </div>
        </FormControl>
      );
    case FormFieldType.DATE_PICKER:
      return (
        <div className="flex rounded-md border text-gray-200 border-dark-500 bg-dark-400">
          <Image
            src="/assets/icons/calendar.svg"
            height={24}
            width={24}
            alt="user"
            className="ml-2"
          />
          <FormControl>
            <ReactDatePicker
              showTimeSelect={props.showTimeSelect ?? false}
              selected={field.value ?? null}
              onChange={(date: Date | null) => field.onChange(date)}
              maxDate={props.name === "birthDate" ? new Date() : undefined}
              minDate={props.name === "schedule" ? new Date() : undefined}
              disabled={props.disabled}
              timeInputLabel="Time:"
              showYearDropdown={props.name === "birthDate"}
              showMonthDropdown={props.name === "birthDate"}
              dropdownMode="select"
              dateFormat={props.dateFormat ?? "MM/dd/yyyy"}
              wrapperClassName="date-picker"
            />
          </FormControl>
        </div>
      );
    case FormFieldType.SELECT:
      return (
          <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={props.disabled}>
            <FormControl>
              <SelectTrigger className="shad-select-trigger text-gray-200">
                <SelectValue placeholder={props.placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="shad-select-content text-gray-200">
              {props.children}
            </SelectContent>
          </Select>
      );
    case FormFieldType.SKELETON:
      return props.renderSkeleton ? props.renderSkeleton(field) : null;
    default:
      return null;
  }
};

const CustomFormField = <T extends FieldValues,>(props: CustomProps<T>) => {
  const { control, name, label } = props;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex-1">
          {props.fieldType !== FormFieldType.CHECKBOX && label && (
            <FormLabel className="shad-input-label text-gray-200">{label}</FormLabel>
          )}
          <RenderInput field={field} props={props} />

          <FormMessage className="shad-error" />
        </FormItem>
      )}
    />
  );
};

export default CustomFormField;

import { phoneNumberAutoFormat } from "@/lib/utils";

interface PhoneNumberParams {
  phone: string;
}

export const PhoneNumber = ({phone}: PhoneNumberParams) => {
  // const [value, setValue] = useState<string>("");

  const value = phoneNumberAutoFormat(phone);
  // setValue(targetValue);

  return (
    <span className="!ml-0">{value}</span>
  );
};

import  Select from 'react-select';
import toast from 'react-hot-toast';

type LockedSelectProps = {
  disabled: boolean;
  message: string;
  [key: string]: any;
};

export const LockedSelect = ({ disabled, message, ...props }: LockedSelectProps) => {
  return (
    <div
      onClick={() => {
        if (disabled) {
          toast.error(message);
        }
      }}
    >
      <Select {...props} isDisabled={disabled} />
    </div>
  );
};


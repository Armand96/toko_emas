import Input from "./SingleElement/Input";
import TextArea from "./SingleElement/TextArea";
import Dropdown from "./SingleElement/Dropdown";
import Radio from "./SingleElement/Radio";
import Checklist from "./SingleElement/Checklist";
import Switch from "./SingleElement/Switch";
import InputPassword from "./SingleElement/Password";
import PhotoInput from "./SingleElement/PhotoInput";

const gridColsMap = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
};

const tabColsMap = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
};

const InputGroup = ({
    fields = [],
    formData = {},
    formError = {},
    onChange,
    cols = "1",
    tabCols = "1",
}) => {
    const getGridClasses = () => {
        const lgClass = gridColsMap[cols] || "lg:grid-cols-1";
        const mdClass = tabColsMap[tabCols] || "md:grid-cols-1";
        return `grid grid-cols-1 ${mdClass} ${lgClass} gap-x-4 gap-y-4`;
    };

    const renderField = (field, index) => {
        const commonProps = {
            key: index,
            label: field.label,
            name: field.name,
            value: formData[field.name],
            placeholder: field.placeholder,
            isDisable: field.isDisable,
            isRequired: field.isRequired,
            error: formError[field.name],
            onChange: onChange,
            colSpan: field.colSpan,
            deskSpan: field.deskSpan,
            helperText: field.helperText,
        };

        switch (field.type) {
            case "text":
            case "email":
            case "number":
            case "date":
                return <Input key={index}  {...commonProps} type={field.type} />;
            case "password":
                return <InputPassword key={index} {...commonProps} type={field.type} />;
            case "photoInput":
                return <PhotoInput key={index} {...commonProps} accept={field.accept} />;
            case "textarea":
                return <TextArea key={index} {...commonProps} rows={field.rows} />;
            case "dropdown":
            case "select":
                return <Dropdown key={index} {...commonProps} options={field.options} />;
            case "radio":
                return (
                    <Radio
                        key={index}
                        {...commonProps}
                        options={field.options}
                        direction={field.direction}
                    />
                );
            case "checklist":
            case "checkbox":
                return (
                    <Checklist
                        {...commonProps}
                        key={index}
                        options={field.options}
                        direction={field.direction}
                    />
                );
            case "switch":
            case "toggle":
                return <Switch key={index} {...commonProps} />;
            case "":
                return <div></div>
            default:
                return null;
        }
    };

    return <div className={getGridClasses()}>{fields.map(renderField)}</div>;
};

export default InputGroup;

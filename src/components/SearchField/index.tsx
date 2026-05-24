import { Input } from "antd";
import type { ChangeEvent, CSSProperties } from "react";
import { SearchOutlined } from "@ant-design/icons";
import "./styles.scss";

interface SearchFieldProps {
    className?: string;
    style?: CSSProperties;
    value?: string;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearch?: (value: string) => void;
}

const SearchField = ({ className = "", style, value, onChange, onSearch }: SearchFieldProps) => {
    return(
        <Input
            placeholder="Pesquisar..."
            prefix={<SearchOutlined style={{ fontSize: 18, color: "#a0a4a8", marginRight: 6, opacity: 0.8 }} />}
            className={`searchField ${className}`.trim()}
            style={style}
            value={value}
            onChange={onChange}
            onPressEnter={(event) => onSearch?.(event.currentTarget.value)}
            allowClear
        />
    )
}

export default SearchField;

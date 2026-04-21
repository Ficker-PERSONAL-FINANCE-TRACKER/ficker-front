import { Input } from "antd";
import type { CSSProperties } from "react";
import { SearchOutlined } from "@ant-design/icons";
import "./styles.scss";

interface SearchFieldProps {
    className?: string;
    style?: CSSProperties;
}

const SearchField = ({ className = "", style }: SearchFieldProps) => {
    return(
        <Input
            placeholder="Pesquisar..."
            prefix={<SearchOutlined style={{ fontSize: 18, color: "#a0a4a8", marginRight: 6, opacity: 0.8 }} />}
            className={`searchField ${className}`.trim()}
            style={style}
        />
    )
}

export default SearchField;

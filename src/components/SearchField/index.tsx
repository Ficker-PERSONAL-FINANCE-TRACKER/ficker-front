import { Input, Image } from "antd";
import type { CSSProperties } from "react";
import "./styles.scss";

interface SearchFieldProps {
    className?: string;
    style?: CSSProperties;
}

const SearchField = ({ className = "", style }: SearchFieldProps) => {
    return(
        <Input
            placeholder="Pesquisar..."
            prefix={<Image src="/icons/icon-search.svg" alt="icon-search" width={25} height={25} />}
            className={`searchField ${className}`.trim()}
            style={style}
        />
    )
}

export default SearchField;

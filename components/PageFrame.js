import Topbar from "./Topbar";
import TickerTape from "./TickerTape";

export default function PageFrame({ children, title, className = "", topbarSearch, mobileSearchToggle }) {
    const viewClassName = ["iv-view", className].filter(Boolean).join(" ");

    return (
        <>
            <Topbar title={title} search={topbarSearch} mobileSearchToggle={mobileSearchToggle} />
            <TickerTape />
            <main className={viewClassName}>{children}</main>
        </>
    );
}

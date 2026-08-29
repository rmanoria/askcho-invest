import Topbar from "./Topbar";
import TickerTape from "./TickerTape";

export default function PageFrame({ children, title, className = "" }) {
    const viewClassName = ["iv-view", className].filter(Boolean).join(" ");

    return (
        <>
            <Topbar title={title} />
            <TickerTape />
            <main className={viewClassName}>{children}</main>
        </>
    );
}

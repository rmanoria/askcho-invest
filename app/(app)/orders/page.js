"use client";
import { useStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import TickerTape from "@/components/TickerTape";
import OrdersTable from "@/components/OrdersTable";

export default function OrdersPage() {
  const { state, cancelOrder } = useStore();

  return (
    <>
      <Topbar title="Orders" />
      <TickerTape />
      <div className="iv-view">
        <OrdersTable orders={state.orders} onCancel={cancelOrder} />
      </div>
    </>
  );
}

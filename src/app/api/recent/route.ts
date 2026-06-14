import { NextResponse } from "next/server";
import { warframeMarket } from "@/integrations/warframeMarket";

export async function GET() {
  try {
    const orders = await warframeMarket.getRecentOrders();

    return NextResponse.json({
      count: orders.length,
      sellCount: orders.filter((order) => order.type === "sell").length,
      buyCount: orders.filter((order) => order.type === "buy").length,
      sample: orders.slice(0, 3),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao consultar ordens recentes", detail: String(error) },
      { status: 502 }
    );
  }
}
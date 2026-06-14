import { NextResponse } from "next/server";
import { warframeMarket } from "@/integrations/warframeMarket";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ urlName: string }> }
) {
  const { urlName } = await params;

  try {
    const orders = await warframeMarket.getBestSellOrders(urlName);

    return NextResponse.json({
      item: urlName,
      source: "warframe.market v2",
      count: orders.length,
      offers: orders.map((order) => ({
        seller: order.user?.ingameName ?? "desconhecido",
        platinum: order.platinum,
        quantity: order.quantity,
        rank: order.rank ?? null,
        reputation: order.user?.reputation ?? null,
        status: order.user?.status ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao consultar o Warframe Market", detail: String(error) },
      { status: 502 }
    );
  }
}
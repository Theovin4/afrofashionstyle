export const dynamic = "force-dynamic";
type Product = { id: number; name: string; category: string; price: number; stock: number; status: string; createdAt: string };
const store = globalThis as typeof globalThis & { afroProducts?: Product[] };
store.afroProducts ??= [];

export async function GET() {
  return Response.json({ products: store.afroProducts });
}
export async function POST(request: Request) {
  const value = await request.json() as Partial<Product>;
  if (!value.name?.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
  const product: Product = { id: Date.now(), name: value.name.trim(), category: value.category ?? "Collection", price: Number(value.price ?? 0), stock: Number(value.stock ?? 0), status: "Active", createdAt: new Date().toISOString() };
  store.afroProducts!.unshift(product);
  return Response.json({ product }, { status: 201 });
}

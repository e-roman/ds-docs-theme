import path from "node:path"
import { readTokens, tokenMap } from "ds-docs-theme/lib/tokens"
import { allTokens } from "@/lib/project"

/** Para el inspector: los tokens del proyecto más los de la tienda (cuyas variables llegan al shadow root). */
const SHOP_TOKENS = path.join(process.cwd(), "playground/public/orali-tokens.css")

export function GET() {
  return Response.json(tokenMap([...allTokens(), ...readTokens(SHOP_TOKENS)]))
}

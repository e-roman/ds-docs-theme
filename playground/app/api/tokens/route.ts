import { tokenMap } from "ds-docs-theme/lib/tokens"
import { allTokens } from "@/lib/project"

export function GET() {
  return Response.json(tokenMap(allTokens()))
}

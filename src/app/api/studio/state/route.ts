import { guard, json, studioState } from '@/studio/api';

export async function GET(req: Request) {
  return guard(req) ?? json(await studioState());
}

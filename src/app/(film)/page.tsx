import { Chapters } from '@/components/Chapters';
import { Hud } from '@/components/Hud';
import { StageLoader } from '@/scene/StageLoader';
import { FilmDriver } from '@/story/FilmDriver';
import { approvedPlates } from '@/studio/approved';

export default async function Film() {
  // Only files that exist on disk get through, so the page can never reference a missing asset.
  const plates = await approvedPlates();
  return (
    <>
      <StageLoader plates={plates} />
      <Chapters plates={plates} />
      <Hud />
      <FilmDriver plateScenes={Object.keys(plates)} />
    </>
  );
}

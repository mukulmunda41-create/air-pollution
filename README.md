# AIR POLLUTION

A seven-chapter scroll film about the air we breathe: from orbit, through a city, in through a child's nose to the deepest point of a lung, and back out to space. A school project.

Built with Next.js, React Three Fiber, GSAP ScrollTrigger and Lenis. Every figure in the film links to its primary source on the `/sources` page.

The city, the street, the child and the views inside the body are illustrations made with generative AI tools. They do not show real people or real places. The PM2.5 readings are illustrative, not live measurements.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Needs Node 20 or later.

`/studio` is the local tool used to upload and approve the film's images and videos. It needs ffmpeg, and it returns 404 in production.

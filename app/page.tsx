import { Hero } from "@/components/Hero";
import { ProjectTeasers } from "@/components/ProjectTeasers";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { Skills } from "@/components/Skills";
import { ContactStrip } from "@/components/ContactStrip";

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectTeasers />
      <About />
      <Experience />
      <Skills />
      <ContactStrip />
    </>
  );
}

import Link from "@/interfaces/Link";
import { Button } from "@mantine/core";
import LinkCard from "./LinkCard";
import { useEditorContext } from "@/contexts/EditorContext";

export default function LinksPanel() {

  const editorContext = useEditorContext();
  const nodes = editorContext.nodes;
  const links = editorContext.links;

  function createLink() {
    console.log("Creating link");
    const newLink: Link = {
      id: links.length,
      source: nodes[0],
      target: nodes[1],

      sourceToTargetPPM: {
        ppm: 5,
        mppm: 1,
      },
      targetToSourcePPM: {
        ppm: 5,
        mppm: 1,
      }
    };

    // setLinks((prev) => [...prev, newLink]);
    // props.onLinkCreate(newLink);
    editorContext.setLinks((prev) => [...prev, newLink]);
  }

  function editLink(link: Link) {
    console.log("Editing link", link);
    editorContext.updateLink(link.id, link);
  }

  function deleteLink(link: Link) {
    console.log("Deleting link", link);
    editorContext.setLinks((prev) => prev.filter((l) => l.id !== link.id));
  }

  return (
    <>
      <Button onClick={createLink} fullWidth>
        Create Connection
      </Button>

      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          onLinkEdit={editLink}
          onLinkDelete={deleteLink}
        />
      ))}
    </>
  )
}
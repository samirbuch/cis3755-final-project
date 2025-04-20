import Link from "@/interfaces/Link";
import Node from "@/interfaces/Node";
import { Button, Flex, Text } from "@mantine/core";
import LinkCard from "./LinkCard";
import { useEditorContext } from "@/contexts/EditorContext";

export default function LinksPanel() {

  const editorContext = useEditorContext();
  const nodes = editorContext.nodes;
  const links = editorContext.links;

  function createLink() {
    console.log("Creating link");
    // const newLink: Link = {
    //   id: links.length,
    //   source: nodes[0],
    //   target: nodes[1],

    //   toPPM: {
    //     ppm: 20,
    //     mppm: 3,
    //   },
    //   fromPPM: {
    //     ppm: 10,
    //     mppm: 1,
    //   }
    // };

    function createRandomLink() {
      // If we have already created all possible links, return null.
      if (links.length >= nodes.length * (nodes.length - 1)) {
        return null;
      }

      // We need to find a link that is not already in the list
      const randomSource = nodes[Math.floor(Math.random() * nodes.length)];
      const randomTarget = nodes[Math.floor(Math.random() * nodes.length)];

      if (randomSource.id === randomTarget.id) {
        return createRandomLink();
      }
      const newLink: Link = {
        id: links.length,
        source: randomSource,
        target: randomTarget,
        toPPM: {
          ppm: Math.floor(Math.random() * 100),
          mppm: Math.floor(Math.random() * 100),
        },
        fromPPM: {
          ppm: Math.floor(Math.random() * 100),
          mppm: Math.floor(Math.random() * 100),
        },
      };
      return newLink;
    }

    const newLink = createRandomLink();
    if(!newLink) {
      console.warn("No more links can be created");
      return;
    }

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
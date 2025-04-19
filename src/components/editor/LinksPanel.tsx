import Link from "@/interfaces/Link";
import Node from "@/interfaces/Node";
import { Button, Flex, Text } from "@mantine/core";

export interface LinksPanelProps {
  nodes: Node[];
  links: Link[];

  onLinkEdit: (link: Link) => void;
  onLinkDelete: (link: Link) => void;
  onLinkCreate: (link: Link) => void;
}
export default function LinksPanel(props: LinksPanelProps) {

  function createLink() {
    console.log("Creating link");
    const newLink: Link = {
      id: props.links.length,
      source: props.nodes[0],
      target: props.nodes[1],
      distance: 100,
    };

    // setLinks((prev) => [...prev, newLink]);
    props.onLinkCreate(newLink);
  }

  return (
    <>
      {props.links.map((link) => (
        <Flex direction="row" key={link.id} align="center" justify="space-between">
          <Text>{`Link ${link.id}: ${link.source.name} -> ${link.target.name}`}</Text>
          <Button
            variant="outline"
            color="red"
            onClick={() => {
              // setLinks(links.filter((l) => l.id !== link.id));
              props.onLinkDelete(link);
            }}
          >
            Delete
          </Button>
        </Flex>
      ))}

      <Button onClick={createLink}>
        Create Connection
      </Button>
    </>
  )
}
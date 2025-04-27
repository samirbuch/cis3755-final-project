import { Button, Card, Container, Flex, Title, Text } from '@mantine/core';
import { animate } from 'animejs';
import { useEffect, useRef, useState } from 'react';

export default function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  const arcRef = useRef<HTMLCanvasElement>(null);
  const arcRefMeaningful = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const arcCanvas = arcRef.current;
    const arcCanvasMeaningful = arcRefMeaningful.current;

    if (!arcCanvas || !arcCanvasMeaningful) return;

    const ctx = arcCanvas.getContext('2d');
    const ctxMeaningful = arcCanvasMeaningful.getContext('2d');

    if (!ctx || !ctxMeaningful) return;

    const radius = 8;

    ctx.beginPath();
    ctx.arc(10, 10, radius, Math.PI, 2 * Math.PI); // Outer arc
    ctx.arc(10, 10, radius * 0.6, 2 * Math.PI, Math.PI, true); // Inner arc
    ctx.closePath();
    ctx.fillStyle = "#FFF";
    ctx.fill();

    ctxMeaningful.shadowBlur = 15;
    ctxMeaningful.shadowColor = "#FFF";
    ctxMeaningful.beginPath();
    ctxMeaningful.arc(10, 10, radius, Math.PI, 2 * Math.PI); // Outer arc
    ctxMeaningful.arc(10, 10, radius * 0.6, 2 * Math.PI, Math.PI, true); // Inner arc
    ctxMeaningful.closePath();
    ctxMeaningful.fillStyle = "#FFF";
    ctxMeaningful.fill();
  }, []);

  const toggleLegend = () => {
    const legendElement = document.getElementById('legend');
    if (!legendElement) return;

    if (isOpen) {
      animate(legendElement, {
        translateY: '100%',
        duration: 500,
        easing: 'easeInOutQuad',
        complete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(true);
      animate(legendElement, {
        translateY: '0%',
        duration: 500,
        easing: 'easeInOutQuad',
      });
    }
  };

  return (
    <div
      id="legend"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        transform: 'translateY(100%)',
        zIndex: 999
      }}
    >
      <Button
        variant={isOpen ? 'filled' : 'outline'}
        onClick={toggleLegend}
        style={{
          position: 'absolute',
          top: '-30px',
          right: '10px',
          width: '100px',
          height: '30px',
          borderRadius: '10px 10px 0 0',
          // backgroundColor: '#333',
          color: 'white',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        {isOpen ? 'Close' : 'Legend'}
      </Button>

      <Card>
        <Container mx="xs">
          <Title order={3}>Legend</Title>
          <Flex direction="row" gap="sm" align="center">
            <Flex align="center">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" fill="white" />
              </svg>
              <Text>Person</Text>
            </Flex>

            <Flex gap={3}>
              <canvas width={20} height={20} ref={arcRef} style={{ transform: "translateY(3px)" }} />
              <Text>Communication</Text>
            </Flex>

            <Flex gap={3}>
              <canvas width={20} height={20} ref={arcRefMeaningful} style={{ transform: "translateY(3px)" }} />
              <Text>Meaningful Communication</Text>
            </Flex>

            <Flex gap={3}>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <line x1="0" y1="10" x2="20" y2="10" stroke="white" strokeWidth="2" />
              </svg>
              <Text>Connection. The shorter a connection, the more meaningful.</Text>
            </Flex>
          </Flex>
        </Container>
      </Card>
    </div>
  );
}
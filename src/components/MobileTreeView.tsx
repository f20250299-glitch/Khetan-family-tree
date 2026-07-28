import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Person, Language } from '../types';
import { calculateGenerations } from '../utils/relationshipEngine';
import { ZoomIn, ZoomOut, Maximize2, Heart, Search, UserPlus, Crown, ChevronDown } from 'lucide-react';
import { t } from '../utils/translations';

interface MobileTreeViewProps {
  persons: Person[];
  language: Language;
  onSelectPerson: (person: Person) => void;
  onAddMember: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

interface NodePosition {
  person: Person;
  x: number;
  y: number;
  isMainRoot?: boolean;
}

interface CoupleConnection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  p1Id: string;
  p2Id: string;
}

interface BranchConnection {
  parentMidX: number;
  parentY: number;
  midY: number;
  children: Array<{ x: number; y: number }>;
}

const CARD_WIDTH = 190;
const CARD_HEIGHT = 110;
const COUPLE_GAP = 20;
const SIBLING_GAP = 40;
const FAMILY_GAP = 80;
const GENERATION_GAP = 150;

export const MobileTreeView: React.FC<MobileTreeViewProps> = ({
  persons,
  language,
  onSelectPerson,
  onAddMember,
  searchQuery,
  setSearchQuery,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 20, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedRootId, setSelectedRootId] = useState<string>('');

  // Structured persons with generation calculation
  const structuredPersons = useMemo(() => calculateGenerations(persons), [persons]);

  // Find root candidates (persons with no parents in tree)
  const rootCandidates = useMemo(() => {
    return structuredPersons.filter((p) => p.parentIds.length === 0);
  }, [structuredPersons]);

  // Determine effective main root person
  const activeRootId = useMemo(() => {
    if (selectedRootId && persons.some((p) => p.id === selectedRootId)) {
      return selectedRootId;
    }
    // Default to the male elder with children or first root candidate
    const patriarch = rootCandidates.find((p) => p.gender === 'male' && p.childrenIds.length > 0);
    if (patriarch) return patriarch.id;
    return rootCandidates[0]?.id || persons[0]?.id || '';
  }, [selectedRootId, rootCandidates, persons]);

  // Calculate strict hierarchical tree layout
  const { nodePositions, coupleLinks, branchLinks, canvasWidth, canvasHeight, generationLanes } = useMemo(() => {
    if (persons.length === 0) {
      return {
        nodePositions: [],
        coupleLinks: [],
        branchLinks: [],
        canvasWidth: 900,
        canvasHeight: 600,
        generationLanes: [],
      };
    }

    const personMap = new Map<string, Person>();
    persons.forEach((p) => personMap.set(p.id, p));

    const processedPersons = new Set<string>();
    const positionsMap = new Map<string, { x: number; y: number }>();
    const positionsList: NodePosition[] = [];
    const coupleConnections: CoupleConnection[] = [];
    const branchConnections: BranchConnection[] = [];

    // Helper: Build subtree structure recursively
    interface SubtreeNode {
      person: Person;
      spouse?: Person;
      childrenNodes: SubtreeNode[];
      unitWidth: number;
      childrenTotalWidth: number;
      subtreeWidth: number;
    }

    function buildSubtree(person: Person): SubtreeNode | null {
      if (processedPersons.has(person.id)) return null;

      // Find primary spouse (preferably one in same generation or opposite gender)
      let spouse: Person | undefined = undefined;
      for (const sId of person.spouseIds) {
        const candidate = personMap.get(sId);
        if (candidate && !processedPersons.has(candidate.id)) {
          spouse = candidate;
          break;
        }
      }

      processedPersons.add(person.id);
      if (spouse) processedPersons.add(spouse.id);

      // Collect children (from both person and spouse)
      const childIdsSet = new Set<string>([...person.childrenIds]);
      if (spouse) {
        spouse.childrenIds.forEach((id) => childIdsSet.add(id));
      }

      const childrenNodes: SubtreeNode[] = [];
      childIdsSet.forEach((cId) => {
        const child = personMap.get(cId);
        if (child && !processedPersons.has(child.id)) {
          const childSubtree = buildSubtree(child);
          if (childSubtree) childrenNodes.push(childSubtree);
        }
      });

      const unitWidth = spouse ? CARD_WIDTH * 2 + COUPLE_GAP : CARD_WIDTH;

      let childrenTotalWidth = 0;
      if (childrenNodes.length > 0) {
        const sumWidths = childrenNodes.reduce((acc, c) => acc + c.subtreeWidth, 0);
        childrenTotalWidth = sumWidths + (childrenNodes.length - 1) * SIBLING_GAP;
      }

      const subtreeWidth = Math.max(unitWidth, childrenTotalWidth);

      return {
        person,
        spouse,
        childrenNodes,
        unitWidth,
        childrenTotalWidth,
        subtreeWidth,
      };
    }

    // 1. First build subtree starting from activeRootId
    const rootSubtrees: SubtreeNode[] = [];
    const mainRootPerson = personMap.get(activeRootId);
    if (mainRootPerson) {
      const mainSubtree = buildSubtree(mainRootPerson);
      if (mainSubtree) rootSubtrees.push(mainSubtree);
    }

    // 2. Build subtrees for any remaining unparented roots
    rootCandidates.forEach((r) => {
      if (!processedPersons.has(r.id)) {
        const st = buildSubtree(r);
        if (st) rootSubtrees.push(st);
      }
    });

    // 3. Build subtrees for any remaining leftover persons
    persons.forEach((p) => {
      if (!processedPersons.has(p.id)) {
        const st = buildSubtree(p);
        if (st) rootSubtrees.push(st);
      }
    });

    // Compute Y positions based on generation
    const genMap = new Map<string, number>();
    structuredPersons.forEach((sp) => genMap.set(sp.id, sp.generation || 1));

    let maxTreeWidth = 0;
    let maxTreeY = 0;

    // Helper: Assign coordinates recursively
    function layoutSubtree(node: SubtreeNode, startX: number, startY: number) {
      const coupleX = startX + (node.subtreeWidth - node.unitWidth) / 2;

      // Position main person
      const pX = coupleX;
      const pY = startY;
      positionsMap.set(node.person.id, { x: pX, y: pY });
      positionsList.push({
        person: node.person,
        x: pX,
        y: pY,
        isMainRoot: node.person.id === activeRootId,
      });

      let coupleMidX = pX + CARD_WIDTH / 2;

      // Position spouse if present
      if (node.spouse) {
        const sX = coupleX + CARD_WIDTH + COUPLE_GAP;
        const sY = startY;
        positionsMap.set(node.spouse.id, { x: sX, y: sY });
        positionsList.push({
          person: node.spouse,
          x: sX,
          y: sY,
          isMainRoot: node.spouse.id === activeRootId,
        });

        // Add couple link line
        coupleConnections.push({
          x1: pX + CARD_WIDTH,
          y1: pY + CARD_HEIGHT / 2,
          x2: sX,
          y2: sY + CARD_HEIGHT / 2,
          p1Id: node.person.id,
          p2Id: node.spouse.id,
        });

        coupleMidX = (pX + sX + CARD_WIDTH) / 2;
      }

      if (pY + CARD_HEIGHT > maxTreeY) maxTreeY = pY + CARD_HEIGHT;

      // Layout children below
      if (node.childrenNodes.length > 0) {
        const childrenStartY = startY + CARD_HEIGHT + GENERATION_GAP;
        let currentChildX = startX + (node.subtreeWidth - node.childrenTotalWidth) / 2;

        const childTargets: Array<{ x: number; y: number }> = [];

        node.childrenNodes.forEach((childNode) => {
          layoutSubtree(childNode, currentChildX, childrenStartY);

          // Get child or child couple midpoint
          const cPX = currentChildX + (childNode.subtreeWidth - childNode.unitWidth) / 2;
          const childMidX = cPX + childNode.unitWidth / 2;
          childTargets.push({ x: childMidX, y: childrenStartY });

          currentChildX += childNode.subtreeWidth + SIBLING_GAP;
        });

        const midY = startY + CARD_HEIGHT + GENERATION_GAP / 2;

        branchConnections.push({
          parentMidX: coupleMidX,
          parentY: pY + CARD_HEIGHT,
          midY,
          children: childTargets,
        });
      }
    }

    // Execute Layout across all root subtrees
    let currentRootX = 60;
    const topY = 60;

    rootSubtrees.forEach((rootTree) => {
      layoutSubtree(rootTree, currentRootX, topY);
      currentRootX += rootTree.subtreeWidth + FAMILY_GAP;
    });

    maxTreeWidth = Math.max(1000, currentRootX + 100);
    const calculatedHeight = Math.max(700, maxTreeY + 200);

    // Generation Lanes
    const genSet = new Set<number>();
    structuredPersons.forEach((p) => genSet.add(p.generation || 1));
    const sortedGens = Array.from(genSet).sort((a, b) => a - b);

    const generationLanesData = sortedGens.map((gIdx) => {
      // Find min Y for nodes in this generation
      const genPersons = structuredPersons.filter((p) => p.generation === gIdx);
      let minY = topY + (gIdx - 1) * (CARD_HEIGHT + GENERATION_GAP);

      const placedY = genPersons
        .map((p) => positionsMap.get(p.id)?.y)
        .filter((y): y is number => y !== undefined);

      if (placedY.length > 0) {
        minY = Math.min(...placedY);
      }

      const labels: Record<number, { en: string; hi: string }> = {
        1: { en: '1st Generation • Elders & Patriarchs', hi: 'प्रथम पीढ़ी • बुजुर्ग व वंशज' },
        2: { en: '2nd Generation • Children & Partners', hi: 'द्वितीय पीढ़ी • बच्चे व जीवनसाथी' },
        3: { en: '3rd Generation • Grandchildren', hi: 'तृतीय पीढ़ी • पोते-पोतियाँ' },
        4: { en: '4th Generation • Great-Grandchildren', hi: 'चतुर्थ पीढ़ी • परपोते-परपोतियाँ' },
      };

      const fallback = {
        en: `${gIdx}th Generation`,
        hi: `${gIdx}वीं पीढ़ी`,
      };

      return {
        genIndex: gIdx,
        y: minY - 20,
        label: labels[gIdx] || fallback,
      };
    });

    return {
      nodePositions: positionsList,
      coupleLinks: coupleConnections,
      branchLinks: branchConnections,
      canvasWidth: maxTreeWidth,
      canvasHeight: calculatedHeight,
      generationLanes: generationLanesData,
    };
  }, [persons, structuredPersons, activeRootId, rootCandidates]);

  // Touch & Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.5, Math.max(0.3, prev + delta)));
  };

  // Native Non-Passive 2-finger Touch Pinch to Zoom & Trackpad Wheel Zoom
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    let initialDist = 0;
    let startZoom = zoom;
    let startPan = { ...pan };
    let startMid = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        startZoom = zoom;
        startPan = { ...pan };
        startMid = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDist > 0) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (currentDist > 0) {
          const ratio = currentDist / initialDist;
          const newZoom = Math.min(2.5, Math.max(0.3, startZoom * ratio));

          const currentMid = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };

          const zoomFactor = newZoom / startZoom;
          const newPanX = currentMid.x - (startMid.x - startPan.x) * zoomFactor;
          const newPanY = currentMid.y - (startMid.y - startPan.y) * zoomFactor;

          setZoom(newZoom);
          setPan({ x: newPanX, y: newPanY });
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialDist = 0;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom((prev) => Math.min(2.5, Math.max(0.3, prev + zoomDelta)));
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);
    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, pan]);

  const centerTreeOnMainRoot = () => {
    if (!canvasRef.current) return;
    const viewportWidth = canvasRef.current.clientWidth || window.innerWidth;
    const isMobile = window.innerWidth < 640;
    const initialZoom = isMobile ? 0.65 : 0.85;

    const mainNode = nodePositions.find((n) => n.isMainRoot) || nodePositions[0];
    if (mainNode) {
      const targetX = viewportWidth / 2 - (mainNode.x + CARD_WIDTH / 2) * initialZoom;
      setZoom(initialZoom);
      setPan({ x: Math.max(20, targetX), y: isMobile ? 80 : 90 });
    } else {
      setZoom(initialZoom);
      setPan({ x: 20, y: 80 });
    }
  };

  useEffect(() => {
    centerTreeOnMainRoot();
  }, [activeRootId, persons.length]);

  const resetPanZoom = () => {
    centerTreeOnMainRoot();
  };

  // Search filter check
  const matchesSearch = (p: Person) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nameHindi && p.nameHindi.toLowerCase().includes(q)) ||
      (p.relationNotes && p.relationNotes.toLowerCase().includes(q))
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-105px)] bg-[#F7F5F2] bg-[radial-gradient(#d1d1d1_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden select-none touch-none flex flex-col">
      {/* Top Bar: Compact & Responsive Search & Main Person Focus Selector */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 max-w-4xl mx-auto pointer-events-auto">
        {/* Search Field */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#1A1A1A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
            className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-[#1A1A1A] rounded-none text-[#1A1A1A] placeholder-[#888] text-xs font-serif italic focus:outline-none shadow-[2px_2px_0px_#1A1A1A] sm:shadow-[3px_3px_0px_#1A1A1A]"
          />
        </div>

        {/* Main Person Focus Selector */}
        {persons.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#1A1A1A] px-2.5 py-1.5 shadow-[2px_2px_0px_#1A1A1A] sm:shadow-[3px_3px_0px_#1A1A1A] text-xs font-sans shrink-0 justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[10px]">
                {language === 'hi' ? 'मुख्य व्यक्ति:' : 'Main Head:'}
              </span>
            </div>
            <select
              value={activeRootId}
              onChange={(e) => setSelectedRootId(e.target.value)}
              className="bg-transparent font-serif font-bold text-[#1A1A1A] text-xs focus:outline-none cursor-pointer pr-1 truncate max-w-[180px] sm:max-w-none"
            >
              {persons.map((p) => (
                <option key={p.id} value={p.id}>
                  {language === 'hi' && p.nameHindi ? p.nameHindi : p.name}
                  {p.gender === 'male' ? ' ♂' : ' ♀'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col gap-1.5 sm:gap-2 bg-white border border-[#1A1A1A] p-1 sm:p-1.5 shadow-[3px_3px_0px_#1A1A1A] sm:shadow-[4px_4px_0px_#1A1A1A]">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 sm:p-2 hover:bg-[#F7F5F2] text-[#1A1A1A] transition"
          title={t(language, 'zoomIn')}
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 sm:p-2 hover:bg-[#F7F5F2] text-[#1A1A1A] transition"
          title={t(language, 'zoomOut')}
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
        </button>
        <button
          onClick={resetPanZoom}
          className="p-1.5 sm:p-2 hover:bg-[#F7F5F2] text-[#1A1A1A] transition"
          title={t(language, 'resetView')}
        >
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#1A1A1A]" />
        </button>
      </div>

      {/* Helper Drag Instruction */}
      <div className="absolute bottom-6 left-6 z-20 hidden xs:block bg-white border border-[#1A1A1A] text-[#1A1A1A] font-sans font-bold uppercase text-[10px] tracking-wider px-3 py-1.5 shadow-[3px_3px_0px_#1A1A1A]">
        {t(language, 'dragToPan')}
      </div>

      {/* Interactive Drag-and-Drop Canvas Viewport */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="relative relative-canvas"
        >
          {/* Generation Lane Guides */}
          {generationLanes.map((lane) => (
            <div
              key={`lane-${lane.genIndex}`}
              style={{ top: `${lane.y}px` }}
              className="absolute left-0 right-0 border-b border-dashed border-[#1A1A1A]/20 pointer-events-none flex items-center pl-4"
            >
              <span className="bg-[#1A1A1A] text-white text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 shadow-[2px_2px_0px_#C2410C]">
                {language === 'hi' ? lane.label.hi : lane.label.en}
              </span>
            </div>
          ))}

          {/* SVG Hierarchical Connector Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* 1. Spouse / Partner Marriage Connections */}
            {coupleLinks.map((link, idx) => (
              <g key={`couple-${idx}`}>
                <line
                  x1={link.x1}
                  y1={link.y1}
                  x2={link.x2}
                  y2={link.y2}
                  stroke="#C2410C"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                <foreignObject
                  x={(link.x1 + link.x2) / 2 - 11}
                  y={link.y1 - 11}
                  width="22"
                  height="22"
                >
                  <div className="flex items-center justify-center text-[#C2410C] bg-white rounded-full p-0.5 border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]">
                    <Heart className="w-3.5 h-3.5 fill-[#C2410C]" />
                  </div>
                </foreignObject>
              </g>
            ))}

            {/* 2. Parent-to-Children Tree Branch Connections */}
            {branchLinks.map((branch, bIdx) => {
              if (branch.children.length === 0) return null;

              const minChildX = Math.min(...branch.children.map((c) => c.x));
              const maxChildX = Math.max(...branch.children.map((c) => c.x));

              return (
                <g key={`branch-${bIdx}`}>
                  {/* Line down from parent couple */}
                  <line
                    x1={branch.parentMidX}
                    y1={branch.parentY}
                    x2={branch.parentMidX}
                    y2={branch.midY}
                    stroke="#1A1A1A"
                    strokeWidth="2"
                  />

                  {/* Horizontal bar connecting children */}
                  <line
                    x1={minChildX}
                    y1={branch.midY}
                    x2={maxChildX}
                    y2={branch.midY}
                    stroke="#1A1A1A"
                    strokeWidth="2"
                  />

                  {/* Vertical line down to parent-to-child horizontal junction */}
                  {branch.parentMidX >= minChildX && branch.parentMidX <= maxChildX ? null : (
                    <line
                      x1={branch.parentMidX}
                      y1={branch.midY}
                      x2={branch.parentMidX < minChildX ? minChildX : maxChildX}
                      y2={branch.midY}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                    />
                  )}

                  {/* Lines down from horizontal bar to each child node */}
                  {branch.children.map((child, cIdx) => (
                    <line
                      key={`child-line-${bIdx}-${cIdx}`}
                      x1={child.x}
                      y1={branch.midY}
                      x2={child.x}
                      y2={child.y}
                      stroke="#1A1A1A"
                      strokeWidth="2"
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Person Node Cards */}
          {nodePositions.map(({ person, x, y, isMainRoot }) => {
            const isMatch = matchesSearch(person);
            const nameDisplay = language === 'hi' && person.nameHindi ? person.nameHindi : person.name;
            const altNameDisplay = language === 'hi' ? person.name : person.nameHindi;
            const birthYear = person.birthDate ? new Date(person.birthDate).getFullYear() : '';
            const deathYear = person.deathDate ? new Date(person.deathDate).getFullYear() : '';

            return (
              <div
                key={person.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPerson(person);
                }}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${CARD_WIDTH}px`,
                  height: `${CARD_HEIGHT}px`,
                }}
                className={`absolute z-10 p-3 bg-white border-2 transition-all cursor-pointer flex items-center gap-3 ${
                  isMainRoot ? 'border-[#C2410C]' : 'border-[#1A1A1A]'
                } ${
                  isMatch
                    ? isMainRoot
                      ? 'shadow-[6px_6px_0px_#C2410C] hover:shadow-[8px_8px_0px_#C2410C] hover:-translate-y-0.5'
                      : 'shadow-[6px_6px_0px_#1A1A1A] hover:shadow-[8px_8px_0px_#1A1A1A] hover:-translate-y-0.5'
                    : 'opacity-30 grayscale shadow-none'
                }`}
              >
                {/* Top Badge for Main Head / Patriarch */}
                {isMainRoot && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C2410C] text-white text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 border border-[#1A1A1A] flex items-center gap-1 shadow-[2px_2px_0px_#1A1A1A]">
                    <Crown className="w-3 h-3" />
                    <span>{language === 'hi' ? 'मुख्य प्रमुख' : 'Main Head'}</span>
                  </div>
                )}

                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      person.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={person.name}
                    className="w-12 h-12 object-cover border border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A]"
                  />
                  {!person.isAlive && (
                    <span className="absolute -top-1 -right-1 bg-[#1A1A1A] text-white border border-[#1A1A1A] text-[9px] px-1 font-serif font-bold">
                      †
                    </span>
                  )}
                </div>

                {/* Person Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-serif font-bold text-[#1A1A1A] truncate leading-tight">
                    {nameDisplay}
                  </h3>
                  {altNameDisplay && (
                    <p className="text-[10px] text-[#C2410C] font-serif italic truncate">
                      {altNameDisplay}
                    </p>
                  )}

                  <div className="mt-1 flex items-center justify-between text-[10px] text-[#555]">
                    <span className="font-sans italic text-[10px]">
                      {birthYear ? (person.isAlive ? `b. ${birthYear}` : `${birthYear}-${deathYear || '?'}`) : ''}
                    </span>
                    <span className="text-[9px] bg-[#F7F5F2] border border-[#1A1A1A] px-1.5 py-0.2 text-[#1A1A1A] font-sans font-bold uppercase">
                      G{person.generation || 1}
                    </span>
                  </div>

                  {person.relationNotes && (
                    <p className="mt-0.5 text-[9px] text-[#666] truncate italic">
                      {person.relationNotes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty Tree State */}
          {persons.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[#555]">
              <p className="text-sm font-serif italic mb-3">No family members in tree yet.</p>
              <button
                onClick={onAddMember}
                className="flex items-center gap-2 bg-[#1A1A1A] text-white font-sans font-bold uppercase text-xs px-4 py-2 border border-[#1A1A1A] shadow-[4px_4px_0px_#C2410C]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Family Member</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

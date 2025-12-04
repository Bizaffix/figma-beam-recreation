import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, X, Upload, FileText, Image as ImageIcon, BookOpen, UtensilsCrossed, MapPin, Coffee, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export type BlockType = "class" | "open_sew" | "meal" | "field_trip" | "rest";

export interface ItineraryBlock {
  id: string;
  type: BlockType;
  title: string;
  description: string;
  time?: string;
  day?: string;
  // Pattern/Project attachments
  patternFile?: string;
  patternFileName?: string;
  supplyList?: string;
  projectImage?: string;
  projectImageName?: string;
}

interface ItineraryBuilderProps {
  blocks: ItineraryBlock[];
  onChange: (blocks: ItineraryBlock[]) => void;
  user?: { id: string } | null;
}

const blockTypeLabels: Record<BlockType, { label: string; icon: typeof Scissors; color: string }> = {
  class: { label: "Class", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
  open_sew: { label: "Open Sew Time", icon: Scissors, color: "bg-green-100 text-green-800" },
  meal: { label: "Meal", icon: UtensilsCrossed, color: "bg-orange-100 text-orange-800" },
  field_trip: { label: "Field Trip", icon: MapPin, color: "bg-purple-100 text-purple-800" },
  rest: { label: "Rest", icon: Coffee, color: "bg-gray-100 text-gray-800" },
};

const templates = {
  "Weekend Quilt Camp": [
    { type: "class" as BlockType, title: "Welcome & Introduction", description: "Meet and greet, overview of the weekend", time: "9:00 AM" },
    { type: "class" as BlockType, title: "Foundation Piecing Basics", description: "Learn the fundamentals of foundation piecing", time: "10:00 AM" },
    { type: "meal" as BlockType, title: "Lunch", description: "Catered lunch", time: "12:00 PM" },
    { type: "open_sew" as BlockType, title: "Open Sew Time", description: "Practice and work on your project", time: "1:00 PM" },
    { type: "class" as BlockType, title: "Advanced Techniques", description: "Explore more complex patterns", time: "3:00 PM" },
    { type: "rest" as BlockType, title: "Break", description: "Coffee and refreshments", time: "4:30 PM" },
    { type: "open_sew" as BlockType, title: "Evening Sew Session", description: "Continue working on projects", time: "6:00 PM" },
    { type: "meal" as BlockType, title: "Dinner", description: "Group dinner", time: "7:00 PM" },
  ],
  "Technique Intensive": [
    { type: "class" as BlockType, title: "Morning Technique Session", description: "Deep dive into specific techniques", time: "9:00 AM" },
    { type: "open_sew" as BlockType, title: "Practice Time", description: "Hands-on practice with guidance", time: "11:00 AM" },
    { type: "meal" as BlockType, title: "Lunch Break", description: "Lunch provided", time: "12:30 PM" },
    { type: "class" as BlockType, title: "Afternoon Technique Session", description: "Continue learning advanced methods", time: "2:00 PM" },
    { type: "rest" as BlockType, title: "Break", description: "Rest and refresh", time: "4:00 PM" },
    { type: "open_sew" as BlockType, title: "Independent Work", description: "Apply techniques to your project", time: "4:30 PM" },
  ],
};

function SortableBlock({ block, onUpdate, onDelete, user }: { block: ItineraryBlock; onUpdate: (block: ItineraryBlock) => void; onDelete: () => void; user?: { id: string } | null }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const { toast } = useToast();
  const [uploadingPattern, setUploadingPattern] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const blockTypeInfo = blockTypeLabels[block.type];
  const Icon = blockTypeInfo.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePatternUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      toast({
        title: "Error",
        description: "Please upload a PDF file for patterns",
        variant: "destructive",
      });
      return;
    }

    setUploadingPattern(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/patterns/${Date.now()}.${fileExt}`;
      const filePath = `retreat-patterns/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retreat-patterns')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-patterns')
        .getPublicUrl(filePath);

      onUpdate({ ...block, patternFile: publicUrl, patternFileName: file.name });
      toast({
        title: "Success",
        description: "Pattern uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload pattern",
        variant: "destructive",
      });
    } finally {
      setUploadingPattern(false);
      e.target.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/project-images/${Date.now()}.${fileExt}`;
      const filePath = `retreat-project-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retreat-project-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-project-images')
        .getPublicUrl(filePath);

      onUpdate({ ...block, projectImage: publicUrl, projectImageName: file.name });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 sm:p-4 bg-card space-y-3 relative">
      {/* Delete button - top right, mobile only */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="absolute top-1 right-1 sm:hidden z-10 h-8 w-8 p-0"
      >
        <X className="w-4 h-4" />
      </Button>
      
      <div className="flex items-start gap-2 sm:gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 touch-none flex-shrink-0">
          <GripVertical className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0 pr-10 sm:pr-0">
          {/* Top row: Badge, Time, Day - mobile responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge className={`${blockTypeInfo.color} text-xs sm:text-sm whitespace-nowrap flex-shrink-0`}>
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                <span className="hidden sm:inline">{blockTypeInfo.label}</span>
                <span className="sm:hidden">{blockTypeInfo.label.split(' ')[0]}</span>
              </Badge>
              <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Time"
                  value={block.time || ""}
                  onChange={(e) => onUpdate({ ...block, time: e.target.value })}
                  className="flex-1 sm:flex-initial sm:w-32 h-8 text-xs sm:text-sm"
                />
                <Input
                  placeholder="Day"
                  value={block.day || ""}
                  onChange={(e) => onUpdate({ ...block, day: e.target.value })}
                  className="flex-1 sm:flex-initial sm:w-32 h-8 text-xs sm:text-sm"
                />
              </div>
            </div>
            {/* Delete button - desktop only */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="hidden sm:flex ml-auto flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Input
            placeholder="Block title (e.g., Foundation Piecing Basics)"
            value={block.title}
            onChange={(e) => onUpdate({ ...block, title: e.target.value })}
            className="text-sm sm:text-base"
          />
          <Textarea
            placeholder="Description or activities..."
            value={block.description}
            onChange={(e) => onUpdate({ ...block, description: e.target.value })}
            rows={2}
            className="text-sm sm:text-base resize-none"
          />
          
          {/* Pattern/Project Attachments - only for class blocks */}
          {block.type === "class" && (
            <div className="space-y-2 sm:space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">Pattern/Project Attachments</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Pattern File (PDF)</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePatternUpload}
                      disabled={uploadingPattern}
                      className="hidden"
                      id={`pattern-${block.id}`}
                    />
                    <label htmlFor={`pattern-${block.id}`} className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPattern}
                        className="w-full text-xs sm:text-sm"
                        asChild
                      >
                        <span className="flex items-center justify-center">
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" />
                          <span className="truncate">
                            {uploadingPattern ? "Uploading..." : block.patternFileName || "Upload Pattern"}
                          </span>
                        </span>
                      </Button>
                    </label>
                  </div>
                  {block.patternFile && (
                    <a
                      href={block.patternFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1.5 truncate"
                    >
                      <FileText className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{block.patternFileName}</span>
                    </a>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Project Image</Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id={`image-${block.id}`}
                    />
                    <label htmlFor={`image-${block.id}`} className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                        className="w-full text-xs sm:text-sm"
                        asChild
                      >
                        <span className="flex items-center justify-center">
                          <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 flex-shrink-0" />
                          <span className="truncate">
                            {uploadingImage ? "Uploading..." : block.projectImageName || "Upload Image"}
                          </span>
                        </span>
                      </Button>
                    </label>
                  </div>
                  {block.projectImage && (
                    <div className="mt-1">
                      <img
                        src={block.projectImage}
                        alt="Project"
                        className="w-full h-16 sm:h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs sm:text-sm">Supply List</Label>
                <Textarea
                  placeholder="List required supplies, tools, and materials..."
                  value={block.supplyList || ""}
                  onChange={(e) => onUpdate({ ...block, supplyList: e.target.value })}
                  rows={3}
                  className="text-sm sm:text-base resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ItineraryBuilder({ blocks, onChange, user }: ItineraryBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: ItineraryBlock = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      title: "",
      description: "",
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (updatedBlock: ItineraryBlock) => {
    onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const applyTemplate = (templateName: keyof typeof templates) => {
    const template = templates[templateName];
    const newBlocks: ItineraryBlock[] = template.map((item, index) => ({
      id: `block-${Date.now()}-${index}`,
      type: item.type,
      title: item.title,
      description: item.description,
      time: item.time,
    }));
    onChange([...blocks, ...newBlocks]);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold">Itinerary Builder</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Drag and drop blocks to organize your retreat schedule
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select onValueChange={(value) => applyTemplate(value as keyof typeof templates)}>
            <SelectTrigger className="w-full sm:w-48 text-xs sm:text-sm">
              <SelectValue placeholder="Apply Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Weekend Quilt Camp">Weekend Quilt Camp</SelectItem>
              <SelectItem value="Technique Intensive">Technique Intensive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-3 sm:pb-4 border-b">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock("class")}
          className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[calc(50%-0.375rem)] sm:min-w-0"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
          <span className="hidden sm:inline">Add </span>Class
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock("open_sew")}
          className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[calc(50%-0.375rem)] sm:min-w-0"
        >
          <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
          <span className="hidden sm:inline">Add </span>Open Sew
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock("meal")}
          className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[calc(50%-0.375rem)] sm:min-w-0"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
          <span className="hidden sm:inline">Add </span>Meal
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock("field_trip")}
          className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[calc(50%-0.375rem)] sm:min-w-0"
        >
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
          <span className="hidden sm:inline">Add </span>Field Trip
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock("rest")}
          className="text-xs sm:text-sm flex-1 sm:flex-initial min-w-[calc(50%-0.375rem)] sm:min-w-0"
        >
          <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
          <span className="hidden sm:inline">Add </span>Rest
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 sm:space-y-3">
            {blocks.length === 0 ? (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">
                    No blocks yet. Add blocks using the buttons above or apply a template.
                  </p>
                </CardContent>
              </Card>
            ) : (
              blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={() => deleteBlock(block.id)}
                  user={user}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}


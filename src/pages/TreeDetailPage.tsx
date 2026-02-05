import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin, Music, Camera, MessageSquare, FileText, Loader2 } from "lucide-react";
import AddOfferingDialog from "@/components/AddOfferingDialog";
import type { Database } from "@/integrations/supabase/types";

type Tree = Database['public']['Tables']['trees']['Row'];
type Offering = Database['public']['Tables']['offerings']['Row'];
type OfferingType = Database['public']['Enums']['offering_type'];

const offeringIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-4 w-4" />,
  song: <Music className="h-4 w-4" />,
  poem: <FileText className="h-4 w-4" />,
  story: <MessageSquare className="h-4 w-4" />,
  nft: <FileText className="h-4 w-4" />,
};

const offeringLabels: Record<OfferingType, string> = {
  photo: "Memories",
  song: "Songs",
  poem: "Poems",
  story: "Musings",
  nft: "NFTs",
};

const TreeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOfferingOpen, setAddOfferingOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OfferingType>("photo");

  // Handle ?add=type query param
  useEffect(() => {
    const addType = searchParams.get('add') as OfferingType | null;
    if (addType && ['photo', 'song', 'poem', 'story', 'nft'].includes(addType)) {
      setSelectedType(addType);
      setAddOfferingOpen(true);
      setSearchParams({}, { replace: true }); // Clear the param
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!id) return;

    const fetchTree = async () => {
      const { data, error } = await supabase
        .from('trees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching tree:', error);
      } else {
        setTree(data);
      }
    };

    const fetchOfferings = async () => {
      const { data, error } = await supabase
        .from('offerings')
        .select('*')
        .eq('tree_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching offerings:', error);
      } else {
        setOfferings(data || []);
      }
    };

    Promise.all([fetchTree(), fetchOfferings()]).then(() => setLoading(false));

    // Subscribe to offerings changes
    const channel = supabase
      .channel(`offerings-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offerings', filter: `tree_id=eq.${id}` },
        () => fetchOfferings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Tree not found</p>
          <Link to="/map" className="block text-center mt-4 text-primary hover:underline">
            Return to Map
          </Link>
        </div>
      </div>
    );
  }

  const getOfferingsByType = (type: OfferingType) => 
    offerings.filter(o => o.type === type);

  const handleAddOffering = (type: OfferingType) => {
    setSelectedType(type);
    setAddOfferingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/map" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Link>

        {/* Tree Info Card */}
        <Card className="mb-8 border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-serif text-primary">{tree.name}</CardTitle>
                <p className="text-muted-foreground italic">{tree.species}</p>
              </div>
              {tree.grove_scale && (
                <Badge variant="outline" className="border-primary text-primary">
                  {tree.grove_scale.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-mono">{tree.what3words}</span>
            </div>
            
            {tree.description && (
              <p className="text-foreground/80">{tree.description}</p>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {tree.nation && <span>🌍 {tree.nation}</span>}
              {tree.state && <span>📍 {tree.state}</span>}
              {tree.bioregion && <span>🌿 {tree.bioregion}</span>}
              {tree.estimated_age && <span>🕰️ ~{tree.estimated_age} years</span>}
            </div>
          </CardContent>
        </Card>

        {/* Offerings Section */}
        <h2 className="text-xl font-serif text-primary mb-4">Offerings</h2>
        
        <Tabs defaultValue="photo" className="w-full">
          <TabsList className="w-full justify-start bg-muted mb-4 flex-wrap h-auto gap-1 p-1">
            {(Object.keys(offeringLabels) as OfferingType[]).map((type) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-1">
                {offeringIcons[type]}
                {offeringLabels[type]}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getOfferingsByType(type).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(offeringLabels) as OfferingType[]).map((type) => (
            <TabsContent key={type} value={type}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{offeringLabels[type]}</h3>
                <Button size="sm" onClick={() => handleAddOffering(type)}>
                  Add {offeringLabels[type].slice(0, -1)}
                </Button>
              </div>
              
              {getOfferingsByType(type).length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/30">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No {offeringLabels[type].toLowerCase()} yet. Be the first to add one!
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {getOfferingsByType(type).map((offering) => (
                    <Card key={offering.id} className="border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{offering.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {offering.media_url && type === 'photo' && (
                          <img 
                            src={offering.media_url} 
                            alt={offering.title}
                            className="w-full h-48 object-cover rounded-md mb-2"
                          />
                        )}
                        {offering.content && (
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                            {offering.content}
                          </p>
                        )}
                        {offering.media_url && type === 'song' && (
                          <audio controls className="w-full mt-2">
                            <source src={offering.media_url} />
                          </audio>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(offering.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <AddOfferingDialog
        open={addOfferingOpen}
        onOpenChange={setAddOfferingOpen}
        treeId={id!}
        type={selectedType}
      />
    </div>
  );
};

export default TreeDetailPage;

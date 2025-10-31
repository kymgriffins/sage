"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { marketDataService } from "@/lib/market-data";

interface ProviderSelectorProps {
  currentProvider: string;
  onProviderChange: (provider: string) => void;
  className?: string;
}

export function ProviderSelector({ currentProvider, onProviderChange, className }: ProviderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableProviders = marketDataService.getAvailableProviders();

  const getProviderDisplayInfo = (providerName: string) => {
    const info = marketDataService.getProviderInfo(providerName);
    if (!info) return null;

    return {
      name: info.name,
      isFree: info.isFree,
      rateLimit: info.rateLimit,
      description: info.isFree
        ? `Free provider with ${info.rateLimit} requests/hour limit`
        : `Premium provider with ${info.rateLimit} requests/minute limit`,
    };
  };

  const currentInfo = getProviderDisplayInfo(currentProvider);

  return (
    <div className={className}>
      <Card className="bg-background/50 border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm">Data Provider</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-xs"
            >
              {isOpen ? 'Done' : 'Change'}
            </Button>
          </div>
        </CardHeader>

        {isOpen ? (
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground mb-3">
              Select your preferred market data provider:
            </div>

            {availableProviders.map((providerName) => {
              const info = getProviderDisplayInfo(providerName);
              if (!info) return null;

              const isSelected = providerName === currentProvider;

              return (
                <div
                  key={providerName}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => {
                    onProviderChange(providerName);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                      <div>
                        <div className="font-medium text-sm">{info.name}</div>
                        <div className="text-xs text-muted-foreground">{info.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={info.isFree ? "secondary" : "default"} className="text-xs">
                        {info.isFree ? 'Free' : 'Premium'}
                      </Badge>
                      {isSelected && (
                        <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        ) : (
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{currentInfo?.name}</div>
                <div className="text-xs text-muted-foreground">{currentInfo?.description}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={currentInfo?.isFree ? "secondary" : "default"} className="text-xs">
                  {currentInfo?.isFree ? 'Free' : 'Premium'}
                </Badge>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

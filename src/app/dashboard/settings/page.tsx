"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser } from "@stackframe/stack";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  LogOut,
  Moon,
  Sun
} from "lucide-react";

export default function SettingsPage() {
  const user = useUser();

  const settingsSections = [
    {
      title: "Account",
      description: "Manage your account settings and preferences",
      icon: User,
      items: [
        { label: "Profile Information", description: "Update your personal details", badge: undefined, custom: undefined },
        { label: "Email Preferences", description: "Manage notification settings", badge: undefined, custom: undefined },
        { label: "Password & Security", description: "Change password and security settings", badge: undefined, custom: undefined }
      ]
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of your dashboard",
      icon: Moon,
      items: [
        {
          label: "Theme",
          description: "Toggle between light and dark mode",
          badge: undefined,
          custom: <ThemeToggle />
        }
      ]
    },
    {
      title: "Notifications",
      description: "Configure how you receive notifications",
      icon: Bell,
      items: [
        { label: "Email Notifications", description: "Market alerts and updates", badge: undefined, custom: undefined },
        { label: "Push Notifications", description: "Real-time trading signals", badge: undefined, custom: undefined },
        { label: "SMS Alerts", description: "Critical market movements", badge: undefined, custom: undefined }
      ]
    },
    {
      title: "Privacy & Security",
      description: "Control your privacy and security settings",
      icon: Shield,
      items: [
        { label: "Data Privacy", description: "Manage your data and privacy", badge: undefined, custom: undefined },
        { label: "API Keys", description: "Manage your API access keys", badge: undefined, custom: undefined },
        { label: "Login History", description: "View recent login activity", badge: undefined, custom: undefined }
      ]
    },
    {
      title: "Billing",
      description: "Manage your subscription and billing",
      icon: CreditCard,
      items: [
        { label: "Current Plan", description: "Free Plan", badge: "Current", custom: undefined },
        { label: "Billing History", description: "View past invoices", badge: undefined, custom: undefined },
        { label: "Payment Methods", description: "Update payment information", badge: undefined, custom: undefined }
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="border-white/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-foreground">{item.label}</h4>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                        {item.custom ? (
                          item.custom
                        ) : (
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        )}
                      </div>
                      {itemIndex < section.items.length - 1 && <Separator className="bg-white/10" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Account Actions */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Account Actions
            </CardTitle>
            <CardDescription>
              Manage your account status and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-destructive/20 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  // Handle account deletion
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    // Implement account deletion
                  }
                }}
              >
                Delete Account
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Handle data export
                  alert('Data export feature coming soon!');
                }}
              >
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

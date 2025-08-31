import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Mail, 
  Users,
  MapPin,
  Plus,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
    const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and fetch dashboard data
    useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Check authentication
        const authRes = await fetch(`${API_URL}/validate-token`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!authRes.ok) {
          localStorage.removeItem("token");
          navigate('/login');
          return;
        }

        // Fetch all clients to calculate statistics
        const clientsRes = await fetch(`${API_URL}/all-clients`, {
          headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });

        // Fetch email statistics
        const emailStatsRes = await fetch(`${API_URL}/email-stats`, {
          headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });

        // Fetch user statistics
        const userStatsRes = await fetch(`${API_URL}/user-stats`, {
          headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });

        if (clientsRes.ok) {
          const clients = await clientsRes.json();
          
          // Debug: Log the number of companies found
          console.log(`Found ${clients.length} companies in database`);
          console.log('Companies:', clients.map(c => c.name));
          
          // Calculate company types
          const companyTypeMap = {};
          clients.forEach(client => {
            const type = client.company_type || 'Unknown';
            companyTypeMap[type] = (companyTypeMap[type] || 0) + 1;
          });

          // Convert to array format for display
          const by_type = Object.entries(companyTypeMap).map(([type, count]) => ({
            type: type === 'charity' ? 'Charity' : type === 'ltd' ? 'CIC' : type,
            count
          }));

          // Calculate companies by city
          const cityMap = {};
          clients.forEach(client => {
            const city = client.postcode?.split(' ')[0] || 'Unknown';
            cityMap[city] = (cityMap[city] || 0) + 1;
          });

          // Get top 3 cities
          const topCities = Object.entries(cityMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([city, count]) => ({ city, count }));

          // Mock priority data
          const by_priority = [
            { priority: 'High', count: 1 },
            { priority: 'Medium', count: Math.max(0, clients.length - 1) },
            { priority: 'Low', count: 0 }
          ].filter(item => item.count > 0);

          // Create recent activity from recent clients
          const recent_activity = clients.slice(0, 6).map((client, index) => ({
            type: 'company_added',
            description: `New company added: ${client.name}`,
            company_name: client.name,
            created_at: Date.now() - (index * 3600000) // Stagger by hours
          }));

          // Get email statistics
          let emailStats = { total_sent: 0, success_rate: 0 };
          if (emailStatsRes.ok) {
            emailStats = await emailStatsRes.json();
            console.log('Email stats:', emailStats);
          }

          // Get user statistics
          let userStats = { total_users: 0 };
          if (userStatsRes.ok) {
            userStats = await userStatsRes.json();
            console.log('User stats:', userStats);
          }

          setDashboardStats({
            companies: {
              total: clients.length,
              contacted: 0,
              by_type,
              by_priority
            },
            emails: {
              total_sent: emailStats.total_sent || 0,
              success_rate: emailStats.success_rate || 0
            },
            users: {
              total: userStats.total_users || 0
            },
            topCities,
            recent_activity
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'company_added':
        return <Building2 className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-stone-500" />;
    }
  };

  if (loading || !dashboardStats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="!p-6 !space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 font-inter !text-2xl" style={{ 
              letterSpacing: 'var(--tracking-tight)',
              fontSize: '1.5rem'
            }}>
              Dashboard
            </h1>
            <p className="text-stone-600 font-inter">
              Welcome to 180Connect CRM - Your client outreach platform
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.companies.total}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                {dashboardStats.companies.contacted} contacted
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.emails.total_sent}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                {dashboardStats.emails.success_rate}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.users.total}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                number of users on the platform
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Companies by City</CardTitle>
              <MapPin className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardStats.topCities.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-inter">{city.city}</span>
                    <Badge variant="secondary" className="font-inter">{city.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Company Overview
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/email')}
                  className="gap-1"
                >
                  View all
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">By Type</h4>
                <div className="space-y-2">
                  {dashboardStats.companies.by_type.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">{item.type}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">By Priority</h4>
                <div className="space-y-2">
                  {dashboardStats.companies.by_priority.map((item) => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">{item.priority}</span>
                      <Badge 
                        variant={item.priority === 'High' ? 'destructive' : 
                                item.priority === 'Medium' ? 'default' : 'secondary'}
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats.recent_activity.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  dashboardStats.recent_activity.slice(0, 6).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-900">
                          {activity.description}
                        </p>
                        {activity.company_name && (
                          <p className="text-xs text-stone-500">
                            {activity.company_name}
                          </p>
                        )}
                        <p className="text-xs text-stone-400">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col"
                variant="outline"
              >
                <Building2 className="w-6 h-6" />
                <span>Add Company</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col"
                variant="outline"
              >
                <Mail className="w-6 h-6" />
                <span>New Campaign</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col"
                variant="outline"
              >
                <MapPin className="w-6 h-6" />
                <span>Import Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

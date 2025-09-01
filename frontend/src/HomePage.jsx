import { Layout } from "@/Components/Layout.jsx";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { 
  Building2, 
  Mail, 
  Users,
  MapPin,
  Plus,
  ArrowUpRight,
  Activity,
  MessageSquare,
  Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
    const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
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

      // Fetch recent activities
      const activitiesRes = await fetch(`${API_URL}/recent-activities?limit=6`, {
        headers: {
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (clientsRes.ok) {
        const clients = await clientsRes.json();
        
        // Debug: Log the number of companies found
        
        
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
          const city = client.city || 'Unknown';
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

        // Get recent activities from backend
        let recent_activity = [];
        if (activitiesRes.ok) {
          recent_activity = await activitiesRes.json();
  
        } else {
          // Fallback: Create recent activity from recent clients
          recent_activity = clients.slice(0, 6).map((client, index) => ({
            type: 'company_added',
            description: `New Client Added: ${client.name}`,
            company_name: client.name,
            created_at: Date.now() - (index * 3600000) // Stagger by hours
          }));
        }

        // Get email statistics
        let emailStats = { total_sent: 0, success_rate: 0 };
        if (emailStatsRes.ok) {
          emailStats = await emailStatsRes.json();
  
        }

        // Get user statistics
        let userStats = { total_users: 0 };
        if (userStatsRes.ok) {
          userStats = await userStatsRes.json();
  
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

  // Check authentication and fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // Refresh data when user returns to the page
    useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    }, []);

  const formatDate = (timestamp) => {
    // Handle both ISO strings and timestamps
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    
    // Debug: Log the timestamp and conversion

    
    // Format in local timezone - JavaScript automatically converts UTC to local time
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const time = date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${day} ${month} at ${time}`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email':
      case 'email_sent':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'interaction':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'company_added':
      case 'client_added':
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
              fontSize: '1.5rem',
              fontWeight: '501',
            }}>
              Dashboard
            </h1>
            <p className="text-stone-600 font-inter">
              Welcome to 180Connect - 180 Degrees' Client Outreach Platform
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Total Clients</CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="!pb-4" style={{ paddingBottom: '1rem !important' }}>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.companies.total}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                {dashboardStats.companies.contacted} Contacted
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="!pb-4" style={{ paddingBottom: '1rem !important' }}>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.emails.total_sent}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                {dashboardStats.emails.success_rate}% Response Rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="!pb-4" style={{ paddingBottom: '1rem !important' }}>
              <div className="text-2xl font-bold text-gray-900 font-inter">{dashboardStats.users.total}</div>
              <p className="text-xs text-gray-500 mt-1 font-inter">
                Users on the Platform
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="!flex !flex-row !items-center !justify-between !space-y-0 !pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 font-inter">Clients by City</CardTitle>
              <MapPin className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent className="!pb-4" style={{ paddingBottom: '1rem !important' }}>
              <div className="space-y-2">
                {dashboardStats.topCities.map((city, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-inter">{city.city}</span>
                    <span className="text-sm font-medium text-gray-900 font-inter">{city.count}</span>
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
              <CardTitle className="flex items-center justify-between !text-2xl" style={{ fontSize: '1.5rem !important' }}>
                Client Overview
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/email')}
                  className="gap-1 hover:!bg-gray-100 hover:!rounded-md !transition-all !duration-200 !text-sm !font-semibold"
                  style={{ fontSize: '0.875rem !important', fontWeight: '600 !important' }}
                >
                  View all
                  <ArrowUpRight className="w-4 h-4" style={{ width: 'calc(var(--spacing) * 4)', height: 'calc(var(--spacing) * 4)' }} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                              <div>
                  <h4 className="!text-sm !font-semibold !mb-2" style={{ fontWeight: '600 !important' }}>By Type</h4>
                  <div className="!space-y-2">
                    {dashboardStats.companies.by_type.map((item) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <span className="!text-sm !text-stone-600">{item.type}</span>
                        <Badge variant="secondary" className="!w-1 !justify-center" style={{ backgroundColor: 'oklch(0.97 0 0)' }}>{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="!mt-6">
                  <h4 className="!text-sm !font-semibold !mb-2" style={{ fontWeight: '600 !important' }}>By Priority</h4>
                <div className="!space-y-2">
                  {dashboardStats.companies.by_priority.map((item) => (
                    <div key={item.priority} className="flex items-center justify-between">
                      <span className="text-sm text-black">{item.priority}</span>
                      <Badge 
                        variant={item.priority === 'High' ? 'destructive' : 
                                item.priority === 'Medium' ? 'default' : 'secondary'}
                        className="!w-1  !justify-center"
                        style={{ color: 'black !important' }}
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
            <CardContent className="!p-0">
              <Tabs defaultValue="all" className="w-full">
                <div className="!flex !flex-row !items-center !justify-between !px-6 !pt-6 !pb-2">
                  <CardTitle className="!text-2xl" style={{ fontSize: '1.5rem !important' }}>Recent Activity</CardTitle>
                  <TabsList className="!inline-flex !rounded-lg !bg-gray-100 !p-0.5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="clients">Clients</TabsTrigger>
                    <TabsTrigger value="emails">Emails</TabsTrigger>
                  </TabsList>
                </div>
                <div className="!px-6 !pb-6">
                <TabsContent value="all" className="space-y-4">
                  {dashboardStats.recent_activity.length === 0 ? (
                    <p className="text-sm text-stone-500 text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    dashboardStats.recent_activity.slice(0, 6).map((activity, index) => (
                      <div key={index} className="!flex !items-start !space-x-3 !mb-3 last:!mb-0">
                        <div className="!flex-shrink-0 !mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="!flex-1 !min-w-0 !space-y-0">
                          <p className="!text-sm !text-stone-900 !mb-0 !leading-tight">
                            {activity.description}
                          </p>
                          {activity.company_name && (
                            <p className="!text-xs !text-stone-500 !mb-0 !mt-0 !leading-tight">
                              {activity.company_name}
                            </p>
                          )}
                          <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                            Added by {activity.user_name} ({activity.user_email})
                          </p>
                          <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="clients" className="space-y-4">
                  {dashboardStats.recent_activity.filter(activity => 
                    activity.type === 'client_added' || activity.type === 'company_added'
                  ).slice(0, 6).map((activity, index) => (
                    <div key={index} className="!flex !items-start !space-x-3 !mb-3 last:!mb-0">
                      <div className="!flex-shrink-0 !mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="!flex-1 !min-w-0 !space-y-0">
                        <p className="!text-sm !text-stone-900 !mb-0 !leading-tight">
                          {activity.description}
                        </p>
                        {activity.company_name && (
                          <p className="!text-xs !text-stone-500 !mb-0 !mt-0 !leading-tight">
                            {activity.company_name}
                          </p>
                        )}
                        <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                          Added by {activity.user_name} ({activity.user_email})
                        </p>
                        <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="emails" className="space-y-4">
                  {dashboardStats.recent_activity.filter(activity => 
                    activity.type === 'email_sent' || activity.type === 'email'
                  ).slice(0, 6).map((activity, index) => (
                      <div key={index} className="!flex !items-start !space-x-3 !mb-3 last:!mb-0">
                        <div className="!flex-shrink-0 !mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="!flex-1 !min-w-0 !space-y-0">
                          <p className="!text-sm !text-stone-900 !mb-0 !leading-tight">
                            {activity.description}
                          </p>
                          {activity.company_name && (
                            <p className="!text-xs !text-stone-500 !mb-0 !mt-0 !leading-tight">
                              {activity.company_name}
                            </p>
                          )}
                          <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                            Added by {activity.user_name} ({activity.user_email})
                          </p>
                          <p className="!text-xs !text-stone-400 !mb-0 !mt-0 !leading-tight">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                    </div>
                  ))}
                </TabsContent>
                </div>

              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="!text-2xl" style={{ fontSize: '1.5rem !important' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col !rounded-lg !transition-all !duration-300"
                variant="outline"
                style={{
                  background: 'linear-gradient(to right, #f8f9fa 50%, white 50%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'right bottom',
                  transition: 'all 0.3s ease, background-position 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundPosition = 'left bottom';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundPosition = 'right bottom';
                }}
              >
                <Building2 className="!w-6 !h-6" />
                <span className="!text-sm !font-semibold" style={{ fontWeight: '600 !important' }}>Add Company</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col !rounded-lg !transition-all !duration-300"
                variant="outline"
                style={{
                  background: 'linear-gradient(to right, #f8f9fa 50%, white 50%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'right bottom',
                  transition: 'all 0.3s ease, background-position 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundPosition = 'left bottom';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundPosition = 'right bottom';
                }}
              >
                <Mail className="w-6 h-6" />
                <span className="!text-sm !font-semibold" style={{ fontWeight: '600 !important' }}>New Campaign</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/email')}
                className="gap-2 h-auto p-4 flex-col !rounded-lg !transition-all !duration-300"
                variant="outline"
                style={{
                  background: 'linear-gradient(to right, #f8f9fa 50%, white 50%)',
                  backgroundSize: '200% 100%',
                  backgroundPosition: 'right bottom',
                  transition: 'all 0.3s ease, background-position 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundPosition = 'left bottom';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundPosition = 'right bottom';
                }}
              >
                <Download className="w-6 h-6" />
                <span className="!text-sm !font-semibold" style={{ fontWeight: '600 !important' }}>Import Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

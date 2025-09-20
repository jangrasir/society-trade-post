import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ShoppingBag } from 'lucide-react';
import { 
  sanitizeInput, 
  validateEmail, 
  validateName, 
  validatePasswordStrength,
  containsSuspiciousPatterns 
} from '@/lib/security';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [hostelPgSociety, setHostelPgSociety] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  
  // Rate limiting for auth attempts
  const authRateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  });

  // Redirect if already authenticated
  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit
    if (!authRateLimit.checkRateLimit()) {
      toast({
        title: 'Too many attempts',
        description: `Please wait before trying again. ${authRateLimit.getRemainingAttempts()} attempts remaining.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate and sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = password; // Don't sanitize password as it may contain special chars
    
    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    if (containsSuspiciousPatterns(sanitizedEmail)) {
      toast({
        title: 'Invalid input',
        description: 'Please check your input and try again',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(sanitizedEmail, sanitizedPassword);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Welcome back to SocietyMart!',
      });
      navigate('/');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit
    if (!authRateLimit.checkRateLimit()) {
      toast({
        title: 'Too many attempts',
        description: `Please wait before trying again. ${authRateLimit.getRemainingAttempts()} attempts remaining.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Validate and sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedHostelPgSociety = sanitizeInput(hostelPgSociety);
    
    if (!sanitizedFullName || !sanitizedHostelPgSociety) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate inputs
    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateName(sanitizedFullName)) {
      toast({
        title: 'Invalid name',
        description: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes',
        variant: 'destructive',
      });
      return;
    }
    
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Weak password',
        description: passwordValidation.message,
        variant: 'destructive',
      });
      return;
    }
    
    // Check for suspicious patterns
    if (containsSuspiciousPatterns(sanitizedEmail) || 
        containsSuspiciousPatterns(sanitizedFullName) || 
        containsSuspiciousPatterns(sanitizedHostelPgSociety)) {
      toast({
        title: 'Invalid input',
        description: 'Please check your input and try again',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(sanitizedEmail, password, sanitizedFullName, sanitizedHostelPgSociety);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Please check your email to confirm your account.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to SocietyMart</CardTitle>
          <CardDescription>
            Your exclusive marketplace for PG, hostel & society members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-location">Hostel/PG/Society</Label>
                  <Input
                    id="signup-location"
                    type="text"
                    placeholder="e.g., ABC Hostel, XYZ PG"
                    value={hostelPgSociety}
                    onChange={(e) => setHostelPgSociety(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
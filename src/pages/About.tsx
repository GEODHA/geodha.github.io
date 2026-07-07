import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Linkedin, Instagram, MessageSquare, Users, Target, BarChart3 } from "lucide-react";
import FourElements from "@/components/FourElements";
import HowItWorks from "@/components/HowItWorks";

const About = () => {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              About{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                GEODHA
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Empowering communities through transparent civic engagement and data-driven solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Four Elements of Nature */}
      <FourElements />

      {/* What does GEODHA aim to do? */}
      <section className="py-16 bg-muted/40">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              What does GEODHA{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                aim to do?
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Engage communities to submit reports of problems they are facing, create maps of the reports to raise awareness on big problems, and facilitate data analytics towards solving these challenges.
              </p>

              <div className="bg-gradient-subtle p-6 rounded-xl border">
                <div className="flex items-start space-x-3">
                  <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Pilot Program Launch</p>
                    <p className="text-muted-foreground">
                      As a pilot program GEODHA will first be launched in <strong>Bengaluru, India.</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <Card className="border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Raising Awareness</h3>
                      <p className="text-muted-foreground">
                        Create visibility for vulnerable communities and issues often unnoticed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Data for Solutions</h3>
                      <p className="text-muted-foreground">
                        Create datasets for researchers, policy makers, and governments to craft comprehensive solutions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Community Empowerment</h3>
                      <p className="text-muted-foreground">
                        Enable citizens to track progress, understand patterns, and drive meaningful change
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />

      {/* How You Can Help Section */}
      <section className="py-16 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              How can you help?
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p className="text-lg leading-relaxed">
                <strong>Spread the word!</strong> We are developing an app for everyone to submit reports of community challenges and view statistics for their community on waste management issues such as open dumps and littering. In the future we aim to track other civic issues like delayed construction, broken footpaths, dirty water, electricity blackouts, air quality, and more.
              </p>
            </div>
            <div className="bg-card p-8 rounded-xl border shadow-soft">
              <h3 className="text-2xl font-bold mb-6 text-center">Potential Applications &amp; Impact</h3>
              <ul className="space-y-4">
                {[
                  "Raising awareness about communities prone to challenges",
                  "Understanding causes and types of waste across different areas",
                  "Tracking progress, frequency and movement - identifying critical bottlenecks",
                  "Consumer perspectives and crowdsourced datasets on civic issues for better planning and management"
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-3 flex-shrink-0"></div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Join Our Team Section */}
      <section className="py-16 bg-muted/40">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "'Archivo', sans-serif" }}
            >
              Join Our Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're looking for passionate individuals to help realize this mission!
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card className="border-0 shadow-soft">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-4">We're looking for:</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li><strong>App Developers</strong> - Help build our platform</li>
                    <li><strong>Content Creators</strong> - Share our story</li>
                    <li><strong>City Representatives</strong> - Help us scale</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-bold mb-6">Contact Us</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="mailto:contact@geodha.org">
                        <Mail className="h-4 w-4 mr-2" />
                        contact@geodha.org
                      </a>
                    </Button>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <a href="https://www.linkedin.com/company/geodha" target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a href="https://www.instagram.com/geodha_org" target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a href="https://www.reddit.com/r/geodha" target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground mb-6">
                Follow us on social media for updates and join the discussion about civic engagement!
              </p>
              <div className="bg-gradient-primary/10 p-8 rounded-xl border">
                <p className="text-lg mb-4">
                  <strong>Want to bring GEODHA to your city or contribute to our mission?</strong>
                </p>
                <Button variant="hero" size="lg" asChild>
                  <a href="https://forms.gle/K3GGQdBe5k2uH44f7" target="_blank" rel="noopener noreferrer">
                    Express Your Interest
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;

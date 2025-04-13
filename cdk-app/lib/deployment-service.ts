import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const path = './resources/build'

export class DeploymentService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "JSCC-OAI");

    const siteBucket = new s3.Bucket(this, "JSCCStaticBucket", {
      autoDeleteObjects: true,
      bucketName: "aws-rss-react",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "JSCCDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: siteBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    new s3deploy.BucketDeployment(this, "JSCCStaticBucketDeployment", {
      sources: [s3deploy.Source.asset(path)],
      destinationBucket: siteBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    });

    const ebUrl = 'sheldongomel-cart-api-dev.eu-west-1.elasticbeanstalk.com';

    // Create CloudFront Distribution
    const cartDistribution = new cloudfront.Distribution(this, 'CartApiDistribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(ebUrl, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: new cloudfront.OriginRequestPolicy(this, 'OriginRequestPolicy', {
          headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(), // Forward all headers
          queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
          cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
        }),
      },
      enabled: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, 'cartDistribution', {
      value: cartDistribution.distributionDomainName,
      description: 'cartDistribution Domain Name',
    });
    new cdk.CfnOutput(this, 'feDistribution', {
      value: distribution.distributionDomainName,
      description: 'feDistribution Domain Name',
    });
  }
}

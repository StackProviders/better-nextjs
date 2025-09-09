import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
	bearer,
	admin,
	multiSession,
	organization,
	twoFactor,
	oneTap,
	oAuthProxy,
	openAPI,
	customSession,
	deviceAuthorization,
	lastLoginMethod,
	createAuthMiddleware,
} from "better-auth/plugins";
import { reactInvitationEmail } from "./email/invitation";
import { reactResetPasswordEmail } from "./email/reset-password";
import { resend } from "./email/resend";
import { nextCookies } from "better-auth/next-js";
import { passkey } from "better-auth/plugins/passkey";
import { stripe } from "@better-auth/stripe";
import { Stripe } from "stripe";
import { prisma } from "./prisma";

const from = process.env.RESEND_SENT_EMAIL || "delivered@resend.dev";

const baseURL = process.env.BETTER_AUTH_URL;

const cookieDomain: string | undefined =
	process.env.VERCEL === "1"
		? process.env.VERCEL_ENV === "production"
			? ".stackprovider.com"
			: process.env.VERCEL_ENV === "preview"
				? `.${process.env.VERCEL_URL}`
				: undefined
		: undefined;

export const auth = betterAuth({
	appName: "Stack Provider Demo",
	baseURL,
	database: prismaAdapter(prisma, {
		provider: "mongodb",
	}),
	rateLimit: {
		enabled: true,
		window: 60, // time window in seconds
		max: 100, // max requests in the window
	},
	emailVerification: {
		async sendVerificationEmail({ user, url }) {
			const res = await resend.emails.send({
				from,
				to: user.email,
				subject: "Verify your email address",
				html: `<a href="${url}">Verify your email address</a>`,
			});
			console.log(res, user.email);
		},
	},
	account: {
		accountLinking: {
			trustedProviders: ["google", "github", "demo-app"],
		},
	},
	emailAndPassword: {
		enabled: true,
		async sendResetPassword({ user, url }) {
			await resend.emails.send({
				from,
				to: user.email,
				subject: "Reset your password",
				react: reactResetPasswordEmail({
					username: user.email,
					resetLink: url,
				}),
			});
		},
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID || "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	plugins: [
		organization({
			async sendInvitationEmail(data) {
				await resend.emails.send({
					from,
					to: data.email,
					subject: "You've been invited to join an organization",
					react: reactInvitationEmail({
						username: data.email,
						invitedByUsername: data.inviter.user.name,
						invitedByEmail: data.inviter.user.email,
						teamName: data.organization.name,
						inviteLink:
							process.env.NODE_ENV === "development"
								? `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`
								: `${process.env.BETTER_AUTH_URL ||
								"https://demo.better-auth.com"
								}/accept-invitation/${data.id}`,
					}),
				});
			},
		}),
		twoFactor({
			issuer: "Stack Provider Demo",
			otpOptions: {
				async sendOTP({ user, otp }) {
					await resend.emails.send({
						from,
						to: user.email,
						subject: "Your OTP",
						html: `Your OTP is ${otp}`,
					});
				},
			},
		}),
		passkey(),
		openAPI(),
		bearer(),
		admin({
			adminUserIds: ["EXD5zjob2SD6CBWcEQ6OpLRHcyoUbnaB"],
		}),
		multiSession(),
		oAuthProxy(),
		nextCookies(),

		oneTap(),
		customSession(async (session) => {
			return {
				...session,
				user: {
					...session.user,
					dd: "test",
				},
			};
		}),
		stripe({
			stripeClient: new Stripe(process.env.STRIPE_KEY || "sk_test_"),
			stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
			subscription: {
				enabled: true,
				allowReTrialsForDifferentPlans: true,
				plans: () => {
					const PRO_PRICE_ID = {
						default:
							process.env.STRIPE_PRO_PRICE_ID ??
							"price_1RoxnRHmTADgihIt4y8c0lVE",
						annual:
							process.env.STRIPE_PRO_ANNUAL_PRICE_ID ??
							"price_1RoxnoHmTADgihItzFvVP8KT",
					};
					const PLUS_PRICE_ID = {
						default:
							process.env.STRIPE_PLUS_PRICE_ID ??
							"price_1RoxnJHmTADgihIthZTLmrPn",
						annual:
							process.env.STRIPE_PLUS_ANNUAL_PRICE_ID ??
							"price_1Roxo5HmTADgihItEbJu5llL",
					};

					return [
						{
							name: "Plus",
							priceId: PLUS_PRICE_ID.default,
							annualDiscountPriceId: PLUS_PRICE_ID.annual,
							freeTrial: {
								days: 7,
							},
						},
						{
							name: "Pro",
							priceId: PRO_PRICE_ID.default,
							annualDiscountPriceId: PRO_PRICE_ID.annual,
							freeTrial: {
								days: 7,
							},
						},
					];
				},
			},
		}),
		deviceAuthorization({
			expiresIn: "3min",
			interval: "5s",
		}),
		lastLoginMethod({
			cookieName: "stackprovider-auth-last-login-method",
		}),
	],
	trustedOrigins: ["exp://"],
	advanced: {
		cookiePrefix: "stackprovider-auth",
		crossSubDomainCookies: {
			enabled: process.env.NODE_ENV === "production",
			domain: cookieDomain,
		},
		cookies: {
			session_token: {
				name: "stackprovider-auth-token",
				attributes: {
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax'
				}
			}
		}
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== '/sign-in/email') {
				return
			}

			const user = await prisma.user.findUnique({
				where: { email: ctx.body?.email }
			})

			if (!user) {
				throw new APIError('BAD_REQUEST', {
					message: 'No account found with this email address'
				})
			}
		})
	}
});

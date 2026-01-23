import { Check } from "lucide-react";

/**
 * SUBSCRIPTIONS PAGE (UI ONLY)
 * Displays the available plans for the user.
 * No real backend connection yet.
 */
const Subscriptions = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/ month",
      features: ["1 WhatsApp Group", "Basic Analytics", "Manual Messaging"],
      current: true, // This is the default plan
    },
    {
      name: "Pro",
      price: "$29",
      period: "/ month",
      features: [
        "10 WhatsApp Groups",
        "Advanced Analytics",
        "Automated Campaigns",
        "Priority Support",
      ],
      current: false,
      popular: true,
    },
    {
      name: "Business",
      price: "$99",
      period: "/ month",
      features: [
        "Unlimited Groups",
        "White Labeling",
        "API Access",
        "Dedicated Manager",
      ],
      current: false,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Upgrade your Plan</h1>
        <p className="text-mvp-sub">Unlock more power for your communities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-mvp-card border rounded-xl p-6 shadow-xl flex flex-col ${
              plan.popular
                ? "border-brand-accent ring-1 ring-brand-accent scale-105"
                : "border-mvp-border"
            }`}
          >
            {plan.popular && (
              <span className="absolute top-0 right-0 bg-brand-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                MOST POPULAR
              </span>
            )}

            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-extrabold text-white">
                {plan.price}
              </span>
              <span className="text-mvp-sub ml-2">{plan.period}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-gray-300"
                >
                  <Check size={16} className="text-brand-accent" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-3 rounded-md font-medium transition-all ${
                plan.current
                  ? "bg-gray-700 text-gray-400 cursor-default"
                  : plan.popular
                    ? "bg-brand-accent hover:opacity-90 text-white"
                    : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {plan.current ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;

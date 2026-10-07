document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tripPlannerForm');
  const result = document.getElementById('tripPlannerResult');
  if (!form || !result) return;

  const dateField = document.getElementById('planner-date');
  const today = new Date();
  dateField.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const packages = [
    { key: 'Aura', name: 'Hyundai Aura', seats: 4, daily: 3900 },
    { key: 'Dzire', name: 'Maruti Suzuki Dzire', seats: 4, daily: 4200 },
    { key: 'Ertiga', name: 'Maruti Suzuki Ertiga', seats: 7, daily: 4800 },
    { key: 'Innova', name: 'Toyota Innova Crysta', seats: 7, daily: 6600 }
  ];
  const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const passengers = Number(data.get('passengers'));
    const days = Number(data.get('days'));
    const pickup = String(data.get('pickup')).trim();
    const destination = String(data.get('destination')).trim();
    const date = String(data.get('date'));
    result.replaceChildren();
    result.classList.remove('is-error', 'is-success');

    if (passengers > 7) {
      result.textContent = "Our largest listed vehicles seat up to 7 passengers. Call +91 95613 45579 and we'll help arrange a suitable option.";
      result.classList.add('is-error');
      return;
    }

    const vehicle = packages.filter(car => car.seats >= passengers).sort((a, b) => a.daily - b.daily)[0];
    const total = vehicle.daily * days;
    const plan = document.createElement('p');
    plan.textContent = `${pickup} to ${destination} - ${days} ${days === 1 ? 'day' : 'days'} - ${passengers} ${passengers === 1 ? 'traveller' : 'travellers'}. Recommended: ${vehicle.name} (${vehicle.seats} seats). Estimated package: ${money(total)} for up to 300 km/day.`;
    result.append(plan);

    const note = document.createElement('small');
    note.textContent = 'Estimate is based on the listed outstation package. Additional kilometres, tolls, parking and state taxes may cost extra; the team will confirm the final fare.';
    result.append(note);

    const link = document.createElement('a');
    const query = new URLSearchParams({
      vehicle: vehicle.key,
      pickup,
      destination,
      travel_date: date,
      passengers: String(passengers),
      notes: `Smart Trip Planner estimate: ${money(total)} for ${days} day(s), up to 300 km/day.`
    });
    link.href = `booking.html?${query.toString()}`;
    link.className = 'pricing-btn';
    link.textContent = 'Continue to booking';
    result.append(link);
    result.classList.add('is-success');
  });
});

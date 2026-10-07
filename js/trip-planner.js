document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tripPlannerForm');
  const result = document.getElementById('tripPlannerResult');
  if (!form || !result) return;

  const tripTypeField = document.getElementById('planner-trip-type');
  const daysField = document.getElementById('planner-days');
  const daysGroup = document.getElementById('planner-days-group');
  const dateField = document.getElementById('planner-date');
  const today = new Date();
  dateField.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  tripTypeField.addEventListener('change', () => {
    const isOutstation = tripTypeField.value === 'outstation';
    daysGroup.hidden = !isOutstation;
    daysField.disabled = !isOutstation;
    daysField.required = isOutstation;
  });

  const amount = text => {
    const value = String(text || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    return value ? Number(value[0]) : null;
  };
  const vehicleKey = name => {
    const value = name.toLowerCase();
    if (value.includes('innova')) return 'Innova';
    if (value.includes('ertiga')) return 'Ertiga';
    if (value.includes('dzire')) return 'Dzire';
    if (value.includes('aura')) return 'Aura';
    return null;
  };
  const readPricingFromPage = () => {
    const fleet = [...document.querySelectorAll('#fleet .fleet-card')].map(card => ({
      name: card.querySelector('h3')?.textContent.trim() || '',
      seats: Number(card.querySelector('.fleet-feat')?.textContent.match(/\d+/)?.[0]) || 0
    }));

    return [...document.querySelectorAll('#pricing .pricing-card')].map(card => {
      const name = card.querySelector('h3')?.textContent.trim() || '';
      const key = vehicleKey(name);
      const details = [...card.querySelectorAll('.pricing-row')].map(row => ({
        label: row.querySelector('.label')?.textContent.trim().toLowerCase() || '',
        value: row.querySelector('.value')?.textContent.trim() || ''
      }));
      const perKm = amount(details.find(row => row.label.includes('per km'))?.value);
      const localPackage = amount(details.find(row => row.label.includes('local'))?.value);
      const outstationDaily = amount(details.find(row => row.label.includes('outstation'))?.value);
      const capacity = fleet.find(item => vehicleKey(item.name) === key)?.seats || 0;

      return { key, name, capacity, perKm, localPackage, outstationDaily };
    }).filter(car => car.key && car.capacity && car.perKm !== null);
  };

  const money = value => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  }).format(value);
  const kmText = value => `${value.toLocaleString('en-IN', { maximumFractionDigits: 3 })} km`;
  const geocodeCache = new Map();
  let lastGeocodeAt = 0;
  let requestInProgress = false;
  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  const geocodePlace = async place => {
    const cacheKey = place.trim().toLocaleLowerCase();
    if (geocodeCache.has(cacheKey)) return geocodeCache.get(cacheKey);

    const delay = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
    if (delay) await wait(delay);
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({ q: place, format: 'jsonv2', addressdetails: '1', limit: '1' });
    lastGeocodeAt = Date.now();
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Location lookup is temporarily unavailable. Please try again in a moment.');
    const places = await response.json();
    const match = places[0];
    if (!match) throw new Error(`We couldn't verify "${place}". Enter a valid city, town or address.`);

    const countryCode = match.address?.country_code?.toLowerCase();
    if (countryCode && countryCode !== 'in') throw new Error('International destinations are not supported.');
    if (countryCode !== 'in') throw new Error(`We couldn't verify that "${place}" is in India. Enter a more specific Indian location.`);

    const location = {
      lat: Number(match.lat),
      lon: Number(match.lon),
      label: match.display_name.split(',').slice(0, 3).join(',')
    };
    geocodeCache.set(cacheKey, location);
    return location;
  };

  const roadDistanceMeters = async (start, end) => {
    const coords = `${start.lon},${start.lat};${end.lon},${end.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false&steps=false`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Road routing is temporarily unavailable. Please try again in a moment.');
    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No drivable road route was found between these locations. Check the pickup and destination.');
    }
    return data.routes[0].distance;
  };

  const showError = message => {
    result.replaceChildren();
    result.textContent = message;
    result.classList.remove('is-success');
    result.classList.add('is-error');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (requestInProgress) return;

    const tripType = tripTypeField.value;
    if (!tripType) {
      showError('Select Local Trip or Outstation Trip to continue.');
      return;
    }

    const button = form.querySelector('[type="submit"]');
    const originalButton = button?.innerHTML;
    const data = new FormData(form);
    const pickup = String(data.get('pickup')).trim();
    const destination = String(data.get('destination')).trim();
    const date = String(data.get('date'));
    const days = tripType === 'local' ? 1 : Number(data.get('days'));
    const passengers = Number(data.get('passengers'));
    const pricing = readPricingFromPage();

    if (!Number.isInteger(passengers) || passengers < 1) {
      showError('Select a valid number of travellers.');
      return;
    }

    const packageField = tripType === 'local' ? 'localPackage' : 'outstationDaily';
    const eligible = pricing.filter(car => car.capacity >= passengers && car[packageField] !== null);
    if (!eligible.length) {
      showError(tripType === 'local'
        ? 'No local package is listed for a vehicle that fits this group. Please call +91 95613 45579.'
        : 'No listed vehicle package fits this group. Please call +91 95613 45579.');
      return;
    }

    requestInProgress = true;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span>Checking Indian road route...</span><i class="fas fa-spinner fa-spin"></i>';
    }
    result.replaceChildren();
    result.classList.remove('is-error', 'is-success');

    try {
      const start = await geocodePlace(pickup);
      const end = await geocodePlace(destination);
      const outboundMeters = await roadDistanceMeters(start, end);
      const returnMeters = await roadDistanceMeters(end, start);
      const roundTripMeters = Math.ceil(outboundMeters + returnMeters);
      const roundTripKm = roundTripMeters / 1000;
      const includedKm = tripType === 'local' ? 80 : days * 300;
      const extraKm = Math.max(0, roundTripKm - includedKm);

      const options = eligible.map(car => {
        const packagePrice = tripType === 'local' ? car.localPackage : car.outstationDaily * days;
        const extraCharge = extraKm * car.perKm;
        return { ...car, packagePrice, extraCharge, total: packagePrice + extraCharge };
      }).sort((a, b) => a.total - b.total);
      const recommended = options[0];

      const route = document.createElement('p');
      route.textContent = `${start.label} to ${end.label} | Round-trip distance: ${kmText(roundTripKm)} (${kmText(outboundMeters / 1000)} going + ${kmText(returnMeters / 1000)} returning).`;
      result.append(route);

      options.forEach((car, index) => {
        const line = document.createElement('p');
        const tripPackage = tripType === 'local'
          ? `Local package (80 km / 8 hours): ${money(car.packagePrice)}`
          : `Outstation package: ${money(car.outstationDaily)}/day × ${days} day(s) = ${money(car.packagePrice)}`;
        const extra = `${kmText(includedKm)} included; ${kmText(extraKm)} extra; extra charge: ${kmText(extraKm)} × ${money(car.perKm)}/km = ${money(car.extraCharge)}`;
        line.textContent = `${car.name} (${car.capacity} seats)${index === 0 ? ' — Recommended' : ''}: ${tripPackage}. ${extra}. Estimated fare: ${money(car.total)}.`;
        result.append(line);
      });

      const note = document.createElement('small');
      note.textContent = 'Road distance is estimated using OpenStreetMap routing. Fare excludes tolls, parking, state taxes and route changes; the team will confirm the final fare.';
      result.append(note);

      const attribution = document.createElement('small');
      attribution.className = 'trip-planner-attribution';
      attribution.append('Place and map data © ');
      const attributionLink = document.createElement('a');
      attributionLink.href = 'https://www.openstreetmap.org/copyright';
      attributionLink.target = '_blank';
      attributionLink.rel = 'noopener noreferrer';
      attributionLink.textContent = 'OpenStreetMap contributors';
      attribution.append(attributionLink, '.');
      result.append(attribution);

      const bookingNotes = `${tripType === 'local' ? 'Local Trip' : 'Outstation Trip'} planner: ${kmText(roundTripKm)} actual round trip; ${kmText(includedKm)} included; ${kmText(extraKm)} extra; ${money(recommended.total)} estimate for ${recommended.name}.`;
      const query = new URLSearchParams({
        vehicle: recommended.key,
        pickup,
        destination,
        travel_date: date,
        passengers: String(passengers),
        notes: bookingNotes
      });
      if (tripType === 'outstation') query.set('days', String(days));
      const link = document.createElement('a');
      link.href = `booking.html?${query.toString()}`;
      link.className = 'pricing-btn';
      link.textContent = 'Continue to booking';
      result.append(link);
      result.classList.add('is-success');
    } catch (error) {
      showError(error.message || 'We could not build this trip plan. Please check the locations and try again.');
    } finally {
      requestInProgress = false;
      if (button) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });
});

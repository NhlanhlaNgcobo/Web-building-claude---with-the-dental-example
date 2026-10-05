import type { Treatment } from '@/types';

/**
 * Treatment content.
 *
 * Written to inform rather than to sell, and deliberately never to diagnose.
 * Where a patient's situation determines the answer, the copy says that an
 * examination is needed instead of guessing on their behalf.
 *
 * Prices are indicative starting fees in cents, in South African Rand. Final
 * fees follow an examination and, where relevant, a written treatment plan.
 */
export const treatments: readonly Treatment[] = [
  {
    slug: 'dental-examination',
    name: 'Dental examination',
    category: 'general',
    summary:
      'A full check of your teeth, gums and bite, with clear notes on anything worth watching.',
    intro:
      'An examination is the appointment everything else is planned from. We look at your teeth, gums, bite and the soft tissues of your mouth, take any images we need, and then talk you through what we found in plain language.',
    explanation: [
      'A routine examination takes about thirty minutes. Most of that time is spent looking carefully and explaining, rather than treating. If something does need attention, you leave knowing what it is, what the options are and what each one costs.',
      'We check for decay, assess the health of your gums, look at how your teeth meet when you bite, and examine the soft tissues. Where it is useful we take small radiographs, which let us see between and inside teeth where decay is not visible by eye.',
      'If you are new to the practice, your first appointment is a little longer because we take a full history and a baseline set of images. That baseline is what makes it possible to spot change at later visits.',
    ],
    suitableFor: [
      'Anyone who has not had a check in the last six to twelve months',
      'New patients who would like a baseline assessment and treatment plan',
      'People who have moved to Durban and need a new practice',
      'Anyone who has noticed a change they would like looked at',
    ],
    whatHappens: [
      {
        title: 'History and what brought you in',
        detail:
          'We ask about your medical history, any medication you take, and anything you have noticed yourself. This matters: some medication affects the mouth, and your own observations are often the most useful information in the room.',
      },
      {
        title: 'Examination',
        detail:
          'A careful look at each tooth, your gums, your bite and the soft tissues of your mouth, including the tongue and the floor of the mouth.',
      },
      {
        title: 'Images where needed',
        detail:
          'Small radiographs where they add something, for example to see between teeth or check the bone around a root. We explain why before we take them.',
      },
      {
        title: 'What we found',
        detail:
          'We show you what we are looking at on the screen and explain it. If treatment is needed you get the options, the sequence and the cost in writing before anything is booked.',
      },
    ],
    durationMinutes: 30,
    priceFromCents: 85_000,
    priceNote:
      'Radiographs, if needed, are charged separately and are quoted before they are taken.',
    faqs: [
      {
        question: 'How often should I have an examination?',
        answer:
          'Every six months suits most people, but the right interval depends on your own risk of decay and gum disease. Some people are comfortably seen once a year, others benefit from more frequent checks. We will recommend an interval and explain the reasoning.',
      },
      {
        question: 'Will I have a cleaning at the same appointment?',
        answer:
          'Not usually. An examination and a professional cleaning are separate appointments because each needs its own time. Many patients book them back to back, and reception can arrange that for you.',
      },
      {
        question: 'Do I need radiographs every visit?',
        answer:
          'No. They are taken when they will change what we do, not routinely. How often depends on your history and what we can see during the examination.',
      },
      {
        question: 'What if I have not been to a dentist in years?',
        answer:
          'That is common and it is not a problem. The appointment is an assessment, not a judgement. We work out where things stand and then agree a sensible order to deal with anything that needs doing.',
      },
    ],
    relatedTreatmentSlugs: ['professional-cleaning', 'gum-health', 'fillings'],
    bookingServiceSlug: 'routine-examination',
    ctaLabel: 'Book a check-up',
    searchTerms: [
      'check up',
      'checkup',
      'check-up',
      'examination',
      'exam',
      'dentist appointment',
      'new patient',
      'routine',
      'x-ray',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'professional-cleaning',
    name: 'Professional cleaning',
    category: 'hygiene',
    summary:
      'A scale and polish that removes hardened deposits brushing cannot shift.',
    intro:
      'Professional cleaning removes the hardened plaque, called tartar or calculus, that builds up over months and cannot be brushed away. It is the single most effective appointment for keeping gums healthy.',
    explanation: [
      'Plaque is soft and comes off with brushing. Left alone for long enough it hardens onto the tooth and below the gum line, where a brush cannot reach. That hardened deposit holds bacteria against the gum, which is what drives bleeding, inflammation and, over time, loss of the bone that supports teeth.',
      'We use an ultrasonic scaler to break up and flush away the deposits, then clean between the teeth by hand where needed, then polish. Most people find it straightforward. If your gums are tender or your teeth are sensitive, tell us and we will adjust.',
      'We finish by showing you the two or three places where cleaning at home is not quite reaching. This is usually more useful than general advice, because it is specific to your mouth.',
    ],
    suitableFor: [
      'Anyone due for routine hygiene maintenance',
      'People who notice bleeding when they brush or floss',
      'People with staining from tea, coffee, red wine or smoking',
      'Anyone preparing for whitening, which works better on a clean surface',
    ],
    whatHappens: [
      {
        title: 'Assessment of your gums',
        detail:
          'We check where your gums bleed and measure the spaces around teeth, so there is a record to compare at your next visit.',
      },
      {
        title: 'Ultrasonic scaling',
        detail:
          'A fine vibrating tip with a water spray breaks up hardened deposits above and just below the gum line.',
      },
      {
        title: 'Hand finishing and polishing',
        detail:
          'Any remaining deposits are removed by hand, then surfaces are polished to leave them smooth, which slows how quickly plaque re-attaches.',
      },
      {
        title: 'What to change at home',
        detail:
          'We point out the specific areas being missed and suggest what would reach them, whether that is a different brushing angle, interdental brushes or floss.',
      },
    ],
    durationMinutes: 45,
    priceFromCents: 95_000,
    priceNote:
      'If there is substantial build-up or gum disease, more than one appointment may be needed. We will tell you before starting.',
    faqs: [
      {
        question: 'Does a cleaning hurt?',
        answer:
          'Most people describe it as uncomfortable in places rather than painful, particularly where gums are already inflamed. Tell us if anything is sore and we will change the setting or approach. Local anaesthetic is available if you would prefer it.',
      },
      {
        question: 'Will cleaning whiten my teeth?',
        answer:
          'It removes surface staining, which often makes teeth look noticeably brighter, but it does not change the underlying colour of the tooth. Whitening is what changes the colour itself.',
      },
      {
        question: 'How often should I have a cleaning?',
        answer:
          'Every six months works for most people. If you are prone to gum problems or build up tartar quickly, three or four monthly visits may keep things more stable. We will suggest an interval based on what we see.',
      },
      {
        question: 'My gums bled afterwards, is that normal?',
        answer:
          'Some bleeding and tenderness for a day or two is common where gums were already inflamed, and it settles as they heal. If bleeding carries on beyond a few days, phone us.',
      },
    ],
    relatedTreatmentSlugs: ['gum-health', 'dental-examination', 'teeth-whitening'],
    bookingServiceSlug: 'scale-and-polish',
    ctaLabel: 'Book a cleaning',
    searchTerms: [
      'cleaning',
      'clean',
      'scale and polish',
      'hygienist',
      'tartar',
      'plaque',
      'bleeding gums',
      'teeth cleaning',
      'descale',
      'stains',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'fillings',
    name: 'Fillings',
    category: 'restorative',
    summary:
      'Tooth-coloured composite that restores a tooth after decay or a chip.',
    intro:
      'A filling repairs a tooth where decay or damage has taken away part of its structure. We use tooth-coloured composite, shaded to match the tooth, bonded in layers and shaped so it works with your bite.',
    explanation: [
      'Decay is removed first, because a filling placed over active decay will fail. Once the tooth is clean we build it back up with composite, curing each layer before adding the next. The result is shaped, polished and checked against your bite.',
      'Composite bonds to the tooth, which means less healthy tooth needs to be removed than with older materials. It is also tooth-coloured, so a well-placed filling is difficult to pick out.',
      'How long a filling lasts depends on its size, where it sits in the mouth and how much force goes through it. Small fillings in front teeth can last many years. Large fillings in back teeth take a great deal of load and may eventually need replacing or, if there is very little tooth left, a crown instead.',
    ],
    suitableFor: [
      'Teeth where decay has been found at an examination',
      'Chipped or worn teeth where the damage is limited',
      'Replacing an older filling that has broken down or is leaking',
      'Sensitivity caused by a specific area of lost tooth surface',
    ],
    whatHappens: [
      {
        title: 'Numbing, if needed',
        detail:
          'Most fillings are done with local anaesthetic. Very shallow ones sometimes do not need it. We will discuss which applies before we start.',
      },
      {
        title: 'Removing the decay',
        detail:
          'The affected tooth structure is cleared away until what remains is sound.',
      },
      {
        title: 'Building the tooth back',
        detail:
          'Composite is bonded in layers and set with a curing light, rebuilding the shape of the tooth.',
      },
      {
        title: 'Shaping and checking the bite',
        detail:
          'The filling is contoured and polished, then checked as you bite and move your jaw so that it does not sit high.',
      },
    ],
    durationMinutes: 45,
    priceFromCents: 125_000,
    priceNote:
      'The fee depends on how many surfaces of the tooth are involved. You will have a figure before treatment starts.',
    faqs: [
      {
        question: 'How long will my filling last?',
        answer:
          'It varies with size and position. A small filling can last well over a decade, while a large one in a back tooth carrying heavy load will have a shorter life. We check existing fillings at every examination.',
      },
      {
        question: 'Can I eat straight afterwards?',
        answer:
          'Composite is fully set before you leave, so yes. What you should wait for is the anaesthetic to wear off, because it is very easy to bite your cheek or tongue without feeling it.',
      },
      {
        question: 'Why is my tooth sensitive after a filling?',
        answer:
          'Mild sensitivity to cold or pressure for a few days is common, particularly after a deeper filling, and it usually settles. If it is getting worse rather than better, or you have pain that lingers, phone us so we can check it.',
      },
      {
        question: 'Do you place amalgam fillings?',
        answer:
          'We place tooth-coloured composite. If you have existing amalgam fillings that are sound, there is usually no reason to replace them simply because of the material.',
      },
    ],
    relatedTreatmentSlugs: ['dental-examination', 'crowns', 'root-canal-treatment'],
    bookingServiceSlug: 'filling-consultation',
    ctaLabel: 'Book a filling appointment',
    searchTerms: [
      'filling',
      'fillings',
      'cavity',
      'cavities',
      'hole in tooth',
      'decay',
      'chipped tooth',
      'composite',
      'tooth coloured filling',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'root-canal-treatment',
    name: 'Root canal treatment',
    category: 'restorative',
    summary:
      'Treatment that saves a tooth when the nerve inside it has become infected.',
    intro:
      'Root canal treatment deals with infection inside a tooth. The nerve and blood supply in the centre of the tooth are removed, the space is cleaned and shaped, and then sealed. The purpose is to keep a tooth that would otherwise need to come out.',
    explanation: [
      'Inside every tooth is a soft core containing nerve and blood vessels. If bacteria reach it, through deep decay, a crack or an injury, it becomes inflamed and then infected. That is what produces the lingering ache, the sensitivity to heat, or the swelling that brings people in.',
      'Treatment involves opening the top of the tooth, removing the infected contents, then cleaning and shaping the narrow canals that run down each root. Those canals are then filled and sealed so bacteria cannot re-enter. It is detailed work and usually takes one or two appointments.',
      'A tooth that has had root canal treatment is more brittle than it was, because the core has been removed and often a good deal of the tooth was already lost to decay. Back teeth are frequently restored with a crown afterwards to protect against fracture. We will tell you whether that applies in your case.',
    ],
    suitableFor: [
      'Teeth with an infected or dying nerve, confirmed by examination and images',
      'Teeth where decay has reached the centre',
      'Teeth that have been injured and are discolouring or causing pain',
      'Situations where keeping the tooth is preferable to removing it',
    ],
    whatHappens: [
      {
        title: 'Diagnosis',
        detail:
          'We test the tooth and take images to confirm the nerve is involved and to see the shape and length of the roots.',
      },
      {
        title: 'Numbing and isolating the tooth',
        detail:
          'Local anaesthetic, then a small sheet is placed around the tooth to keep the area clean and dry while we work.',
      },
      {
        title: 'Cleaning and shaping the canals',
        detail:
          'The infected contents are removed and each canal is cleaned, shaped and disinfected. This is the part that takes the time.',
      },
      {
        title: 'Sealing and restoring',
        detail:
          'The canals are filled and sealed, and the tooth is restored. Where a crown is recommended, that is planned as a separate appointment.',
      },
    ],
    durationMinutes: 90,
    priceFromCents: 450_000,
    priceNote:
      'The fee depends on which tooth is involved, because front teeth have one canal and molars commonly have three or four. Any crown afterwards is quoted separately.',
    faqs: [
      {
        question: 'Is root canal treatment painful?',
        answer:
          'The treatment itself is done under local anaesthetic and should not be painful. Most people arrive in more discomfort than they leave in, because the source of the pain is being removed. Some tenderness when biting for a few days afterwards is normal.',
      },
      {
        question: 'How many appointments will I need?',
        answer:
          'Often one, sometimes two. If there is active infection it can be better to clean the tooth, place a dressing and complete the seal at a second visit. We will explain which approach suits your tooth.',
      },
      {
        question: 'Could I just have the tooth out instead?',
        answer:
          'Extraction is always an option and sometimes the more sensible one. It is quicker and costs less initially, but it leaves a gap that may need a bridge or implant later. We will set out both paths with costs so you can decide.',
      },
      {
        question: 'Will the tooth go dark?',
        answer:
          'It can, particularly a front tooth that was injured. There are ways to address discolouration afterwards, including internal whitening or a veneer or crown. It is worth raising at the planning stage.',
      },
    ],
    relatedTreatmentSlugs: ['crowns', 'tooth-extraction', 'emergency-dentistry'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a root canal consultation',
    searchTerms: [
      'root canal',
      'root treatment',
      'abscess',
      'infected tooth',
      'toothache',
      'severe pain',
      'nerve pain',
      'dying tooth',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'crowns',
    name: 'Crowns',
    category: 'restorative',
    summary:
      'A custom-made cap that rebuilds and protects a tooth that is too damaged to fill.',
    intro:
      'A crown covers a tooth completely, restoring its shape and strength. It is what we use when there is not enough sound tooth left to hold a filling, or when a tooth needs protecting against fracture.',
    explanation: [
      'A tooth that has lost a lot of structure, whether to a large old filling, a fracture or root canal treatment, can flex under load and split. A crown holds the remaining tooth together and takes the biting force itself.',
      'The tooth is prepared by reducing it slightly on all surfaces so the crown has room to sit without making the tooth bulky. We take a digital scan or impression, fit a temporary crown, and the laboratory makes the final one to match your other teeth.',
      'Crowns are made in several materials. All-ceramic looks most natural and suits front teeth. Zirconia is very strong and suits molars carrying heavy load. We will recommend a material based on where the tooth sits and how much force goes through it.',
    ],
    suitableFor: [
      'Teeth with large fillings that are cracking or failing',
      'Back teeth that have had root canal treatment',
      'Teeth that have fractured but still have a sound root',
      'Heavily worn teeth where shape and height need rebuilding',
    ],
    whatHappens: [
      {
        title: 'First appointment: preparation',
        detail:
          'Under local anaesthetic the tooth is shaped, then scanned or impressed. The colour is matched to your neighbouring teeth.',
      },
      {
        title: 'Temporary crown',
        detail:
          'A temporary is fitted so you can eat and speak normally while the laboratory makes the final crown.',
      },
      {
        title: 'Laboratory stage',
        detail:
          'A dental technician makes the crown to the prescription and shade. This usually takes one to two weeks.',
      },
      {
        title: 'Second appointment: fitting',
        detail:
          'We try the crown in, check the fit, margins, contact with neighbouring teeth and your bite, then bond it in place.',
      },
    ],
    durationMinutes: 60,
    priceFromCents: 850_000,
    priceNote:
      'Covers preparation, laboratory work and fitting. The final figure depends on the material chosen and is confirmed in a written plan.',
    faqs: [
      {
        question: 'How long does a crown last?',
        answer:
          'Many last well over ten years. Longevity depends more on the health of the tooth and gum underneath than on the crown itself, which is why cleaning around the margin matters.',
      },
      {
        question: 'Will it look like my other teeth?',
        answer:
          'That is the intention. We match shade and shape to the teeth either side, and for front teeth we can arrange for you to see and approve the crown before it is bonded permanently.',
      },
      {
        question: 'Can a crown decay?',
        answer:
          'The crown cannot, but the tooth beneath it can, usually at the margin where the crown meets the tooth. Keeping that line clean is what protects the work.',
      },
      {
        question: 'What if my temporary crown comes off?',
        answer:
          'Phone us and we will re-cement it. Temporaries are deliberately held with weak cement so they can be removed easily, so this does happen. Avoid chewing sticky food on that side in the meantime.',
      },
    ],
    relatedTreatmentSlugs: ['bridges', 'root-canal-treatment', 'veneers'],
    bookingServiceSlug: 'crown-consultation',
    ctaLabel: 'Book a crown consultation',
    searchTerms: [
      'crown',
      'crowns',
      'cap',
      'broken tooth',
      'cracked tooth',
      'large filling',
      'zirconia',
      'porcelain crown',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'bridges',
    name: 'Bridges',
    category: 'restorative',
    summary:
      'A fixed replacement for a missing tooth, anchored to the teeth either side.',
    intro:
      'A bridge fills the gap left by a missing tooth using the teeth on either side as support. It is fixed in place, so it is not removed for cleaning, and it restores both appearance and the ability to bite on that side.',
    explanation: [
      'A gap is not only a cosmetic matter. Neighbouring teeth can drift or tilt into the space, the tooth above or below can over-erupt, and chewing load redistributes onto other teeth. Closing the gap keeps the arch stable.',
      'A conventional bridge involves preparing the teeth either side of the gap for crowns, which are joined to a replacement tooth in the middle. The whole unit is made in the laboratory and bonded in place as one piece.',
      'A bridge is not always the right answer. Where the neighbouring teeth are healthy and untouched, an implant may be preferable because it does not involve altering them. Where they already need crowns, a bridge can be the more efficient option. We will set out both.',
    ],
    suitableFor: [
      'A single missing tooth with sound teeth on both sides of the gap',
      'Patients who would prefer something fixed rather than removable',
      'Situations where the neighbouring teeth already need crowns',
      'Cases where an implant is not suitable or not preferred',
    ],
    whatHappens: [
      {
        title: 'Assessment and planning',
        detail:
          'We examine the gap and the supporting teeth, take images to check the bone and roots, and discuss bridge against implant with costs for each.',
      },
      {
        title: 'Preparing the supporting teeth',
        detail:
          'Under local anaesthetic the teeth either side are shaped to receive crowns, then scanned or impressed.',
      },
      {
        title: 'Temporary bridge',
        detail:
          'A temporary is fitted so the gap is not visible and the prepared teeth are protected.',
      },
      {
        title: 'Fitting',
        detail:
          'The finished bridge is tried in, checked for fit, bite and how well you can clean beneath it, then bonded in place.',
      },
    ],
    durationMinutes: 60,
    priceFromCents: 1_400_000,
    priceNote:
      'Depends on the number of units involved. A written plan with the full figure is provided before treatment begins.',
    faqs: [
      {
        question: 'How do I clean under a bridge?',
        answer:
          'With interdental brushes or a floss threader designed for the purpose. We will show you on your own bridge at the fitting appointment, because this is the single thing that most affects how long it lasts.',
      },
      {
        question: 'Bridge or implant?',
        answer:
          'It depends on the condition of the neighbouring teeth, the bone where the tooth is missing, and your preference. A bridge is quicker and does not involve surgery. An implant leaves the adjacent teeth untouched. We will go through both properly.',
      },
      {
        question: 'How long does a bridge last?',
        answer:
          'Commonly ten years or more. The usual reason one needs replacing is a problem in a supporting tooth rather than failure of the bridge itself.',
      },
      {
        question: 'Will it feel bulky?',
        answer:
          'There is an adjustment period of a few days, mostly to the feel of the tissue side. Most people stop noticing it quickly.',
      },
    ],
    relatedTreatmentSlugs: ['crowns', 'dental-implant-consultation', 'dentures'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a bridge consultation',
    searchTerms: [
      'bridge',
      'bridges',
      'missing tooth',
      'gap in teeth',
      'replace tooth',
      'lost tooth',
      'tooth gap',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'tooth-extraction',
    name: 'Tooth extraction',
    category: 'surgical',
    summary:
      'Removing a tooth that cannot be saved, done carefully and with the gap planned for.',
    intro:
      'Sometimes a tooth cannot be kept, because of extensive decay, a fracture below the gum, or advanced gum disease. Removing it relieves the problem, and we plan what happens to the space at the same time.',
    explanation: [
      'Extraction is done under local anaesthetic. The tooth is loosened and lifted out rather than pulled, which protects the surrounding bone. You feel pressure and movement but should not feel pain.',
      'Afterwards a blood clot forms in the socket, and that clot is what the healing depends on. We give you clear written instructions, and the main points are to avoid rinsing vigorously, smoking, or using a straw for the first day.',
      'We also talk about the gap before we create it. Depending on which tooth it is, you may not need anything, or you may want to consider a bridge, an implant or a denture. Deciding in advance is easier than deciding afterwards.',
    ],
    suitableFor: [
      'Teeth with decay or fracture too extensive to restore',
      'Teeth loose from advanced gum disease',
      'Teeth with infection that has not resolved with other treatment',
      'Cases where extraction is part of a wider plan',
    ],
    whatHappens: [
      {
        title: 'Assessment',
        detail:
          'Images to see the root shape and the surrounding bone, and a discussion of what will fill the space afterwards if anything.',
      },
      {
        title: 'Local anaesthetic',
        detail:
          'The area is fully numbed. We check it is working properly before starting.',
      },
      {
        title: 'Removing the tooth',
        detail:
          'The tooth is eased out, working with the socket rather than against it to preserve as much bone as possible.',
      },
      {
        title: 'Aftercare',
        detail:
          'We make sure bleeding has settled, then give you written instructions and a point of contact if you are worried over the next few days.',
      },
    ],
    durationMinutes: 45,
    priceFromCents: 140_000,
    priceNote:
      'A surgical extraction, where the tooth needs to be removed in sections, is charged differently. You will know which applies after the assessment.',
    faqs: [
      {
        question: 'How long does healing take?',
        answer:
          'The gum surface closes over within one to two weeks. The bone underneath continues filling in for several months. Most people are comfortable within a few days.',
      },
      {
        question: 'Will I be left with a visible gap?',
        answer:
          'It depends which tooth. Back teeth are often not visible at all. For anything in the smile line we discuss how to fill the space as part of planning, before the extraction happens.',
      },
      {
        question: 'What should I eat afterwards?',
        answer:
          'Soft food for the first day or two, and avoid anything very hot while you are still numb. Chew on the other side until the socket feels settled.',
      },
      {
        question: 'When should I phone you after an extraction?',
        answer:
          'If bleeding has not settled with firm pressure, if pain is increasing from about day three rather than improving, or if you develop a fever or spreading swelling. Those are worth a call rather than waiting.',
      },
    ],
    relatedTreatmentSlugs: [
      'wisdom-tooth-consultation',
      'dental-implant-consultation',
      'emergency-dentistry',
    ],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book an extraction consultation',
    searchTerms: [
      'extraction',
      'tooth out',
      'remove tooth',
      'pull tooth',
      'loose tooth',
      'broken tooth',
      'take tooth out',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'wisdom-tooth-consultation',
    name: 'Wisdom tooth consultation',
    category: 'surgical',
    summary:
      'An assessment of whether your wisdom teeth need anything doing at all.',
    intro:
      'Wisdom teeth come through in the late teens or twenties, and often there is not enough room. This appointment establishes the position of yours and whether they need treatment, monitoring, or simply leaving alone.',
    explanation: [
      'Plenty of wisdom teeth cause no trouble and are best left in place. Others become partly covered by gum, which creates a pocket that is impossible to clean properly, and that leads to recurring infection, decay in the wisdom tooth or the one in front of it, or pressure.',
      'The consultation involves examining the area and taking an image that shows the whole jaw, so we can see the angle of each wisdom tooth, how much room there is, and the position of nearby structures such as the nerve in the lower jaw.',
      'If removal is recommended we explain why, what it involves, and the specific risks for your anatomy. Some wisdom teeth are straightforward and can be removed here. Others are better referred to a specialist, and we will say so plainly if that is the case.',
    ],
    suitableFor: [
      'Late teens and young adults whose wisdom teeth are coming through',
      'Anyone with recurring soreness, swelling or bad taste at the back of the jaw',
      'People who have been told their wisdom teeth may need watching',
      'Patients who want a clear answer about whether anything needs doing',
    ],
    whatHappens: [
      {
        title: 'Examination',
        detail:
          'We look at how much of each wisdom tooth has come through, the state of the gum around it, and the tooth in front.',
      },
      {
        title: 'Imaging',
        detail:
          'An image covering the whole jaw shows the angle and depth of each wisdom tooth and its relationship to surrounding structures.',
      },
      {
        title: 'Discussion',
        detail:
          'We explain what we can see and give you a recommendation: leave, monitor, remove here, or refer.',
      },
      {
        title: 'Planning',
        detail:
          'If removal makes sense, you get the method, recovery expectations, risks and cost in writing before anything is booked.',
      },
    ],
    durationMinutes: 30,
    priceFromCents: 95_000,
    priceNote:
      'Covers the consultation and assessment. Imaging and any treatment are quoted separately.',
    faqs: [
      {
        question: 'Do all wisdom teeth need to come out?',
        answer:
          'No. If a wisdom tooth is fully through, in a reasonable position and can be kept clean, the usual advice is to leave it. Removal is for teeth that are causing problems or are very likely to.',
      },
      {
        question: 'What is recovery like if one is removed?',
        answer:
          'Expect swelling and discomfort peaking around day two or three, then improving. Simple cases settle within a few days, more involved ones take a week or so. We give specific guidance for your case.',
      },
      {
        question: 'Can both sides be done at once?',
        answer:
          'Often yes, and many people prefer a single recovery period. It depends on the difficulty of each side. We will discuss what is sensible for you.',
      },
      {
        question: 'Will I need to be referred?',
        answer:
          'Sometimes. Where a tooth sits very close to the nerve in the lower jaw, or is deeply buried, a specialist is the right person. We would rather refer than take on something that is better done elsewhere.',
      },
    ],
    relatedTreatmentSlugs: ['tooth-extraction', 'emergency-dentistry', 'dental-examination'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a wisdom tooth consultation',
    searchTerms: [
      'wisdom tooth',
      'wisdom teeth',
      'back tooth pain',
      'impacted',
      'jaw pain',
      'swollen gum at back',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'dentures',
    name: 'Dentures',
    category: 'restorative',
    summary:
      'Removable replacements for several missing teeth, made to fit and to look natural.',
    intro:
      'Dentures replace missing teeth and the surrounding gum. They are removable, made individually for your mouth, and can replace anything from a few teeth to a full arch.',
    explanation: [
      'A partial denture fills several gaps and clips onto remaining teeth. A full denture replaces an entire upper or lower arch. Both are made over a series of appointments, because fit and bite have to be developed in stages rather than guessed in one visit.',
      'Getting used to a denture takes time. Speech and eating feel different at first, and most people need a small number of adjustment visits in the first few weeks as pressure points reveal themselves. That is a normal part of the process rather than a sign something is wrong.',
      'Lower full dentures are harder to stabilise than upper ones, because there is less ridge to hold them and the tongue moves against them. Where that is a problem, implants can be used to hold a denture firmly in place. We will mention it if it is relevant to you.',
    ],
    suitableFor: [
      'Several missing teeth in the same arch',
      'Replacing a full upper or lower arch',
      'Patients for whom implants or bridges are not suitable or not preferred',
      'Replacing an old denture that no longer fits as the ridge has changed',
    ],
    whatHappens: [
      {
        title: 'Assessment and impressions',
        detail:
          'We examine the ridges and any remaining teeth, then take impressions to have accurate models made.',
      },
      {
        title: 'Bite registration and try-in',
        detail:
          'We record how your jaws meet, then you see the teeth set in wax so shape, shade and position can be approved before anything is finished.',
      },
      {
        title: 'Fitting',
        detail:
          'The finished denture is fitted and adjusted, and we go through inserting, removing and cleaning it.',
      },
      {
        title: 'Review and adjustment',
        detail:
          'A follow-up to ease any pressure points. More than one of these is common and is included in the plan.',
      },
    ],
    durationMinutes: 45,
    priceFromCents: 950_000,
    priceNote:
      'Varies considerably with the number of teeth, the materials and whether the denture is partial or full. A staged plan with costs is provided after assessment.',
    faqs: [
      {
        question: 'How long until a denture feels normal?',
        answer:
          'Most people adapt over a few weeks. Speech usually settles first, eating takes a little longer. Starting with softer food cut small makes the first fortnight easier.',
      },
      {
        question: 'Do I take it out at night?',
        answer:
          'Generally yes. Leaving the tissues uncovered overnight is better for them, and it gives you a chance to clean the denture properly. Store it in water or a cleaning solution rather than dry.',
      },
      {
        question: 'Will anyone be able to tell?',
        answer:
          'A well-made denture is not obvious. The try-in stage exists precisely so you can see and adjust the shape, shade and tooth position before it is finished.',
      },
      {
        question: 'Can implants help hold a denture in?',
        answer:
          'Yes, and for lower dentures in particular it makes a substantial difference to stability. It involves surgery and additional cost, so it is a separate conversation we are happy to have.',
      },
    ],
    relatedTreatmentSlugs: ['bridges', 'dental-implant-consultation', 'tooth-extraction'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a denture consultation',
    searchTerms: [
      'denture',
      'dentures',
      'false teeth',
      'plate',
      'missing teeth',
      'partial denture',
      'full denture',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'dental-implant-consultation',
    name: 'Dental implant consultation',
    category: 'surgical',
    summary:
      'An assessment of whether an implant is the right way to replace a missing tooth.',
    intro:
      'An implant is a titanium post placed in the jawbone to support a replacement tooth. This consultation establishes whether that is possible and sensible in your case, with a clear plan and cost if it is.',
    explanation: [
      'An implant replaces the root of a missing tooth. Once the bone has integrated with the post, a crown is attached. The main advantage over a bridge is that the neighbouring teeth are left completely untouched.',
      'Whether an implant is possible depends mostly on the bone available where the tooth is missing, and on general health factors that affect healing. The consultation involves examining the site and taking three-dimensional imaging so the bone can be measured properly rather than estimated.',
      'Implant treatment runs over months rather than weeks, because the bone needs time to integrate with the post before the tooth is loaded. We will set out the full timeline, the number of appointments, what you will have in the meantime, and the total cost before you commit to anything.',
      'We will also tell you honestly if an implant is not the best option for you. A bridge or a denture is sometimes the more sensible answer, and the consultation is worthwhile either way.',
    ],
    suitableFor: [
      'A single missing tooth where the neighbouring teeth are healthy',
      'Several missing teeth in the same area',
      'Patients who would prefer not to alter the teeth either side of a gap',
      'Securing a lower denture that will not stay in place',
    ],
    whatHappens: [
      {
        title: 'Examination of the site',
        detail:
          'We assess the gap, the gum, the neighbouring teeth and how your teeth meet.',
      },
      {
        title: 'Three-dimensional imaging',
        detail:
          'A scan that lets us measure the height and width of available bone and see the position of nerves and sinuses.',
      },
      {
        title: 'Discussion of options',
        detail:
          'Implant, bridge or denture, set out with the advantages, the drawbacks and the cost of each. No pressure toward any of them.',
      },
      {
        title: 'Written plan',
        detail:
          'If you proceed, you get a staged plan with the timeline, each appointment, and the total fee.',
      },
    ],
    durationMinutes: 45,
    priceFromCents: 120_000,
    priceNote:
      'This is the consultation and assessment fee. Implant treatment itself is quoted in a written plan afterwards, and the fee varies with the number of implants and whether bone grafting is needed.',
    faqs: [
      {
        question: 'How long does implant treatment take overall?',
        answer:
          'Typically three to six months from placement to the final tooth, because the bone needs that time to integrate with the post. Where grafting is needed first it takes longer. You are not left with a visible gap during that period.',
      },
      {
        question: 'Is placing an implant painful?',
        answer:
          'Placement is done under local anaesthetic and most people describe it as more comfortable than they expected, often easier than having a tooth out. Some swelling and discomfort for a few days afterwards is normal.',
      },
      {
        question: 'What if I do not have enough bone?',
        answer:
          'Bone can often be augmented with a graft, either at the time of placement or beforehand. The scan at the consultation is what tells us whether that is needed, which is why we take it before quoting.',
      },
      {
        question: 'How long do implants last?',
        answer:
          'Many function for decades. What matters most is keeping the gum around the implant healthy, because implants can be lost to gum and bone problems in much the same way teeth are. Regular maintenance appointments are part of the plan.',
      },
    ],
    relatedTreatmentSlugs: ['bridges', 'tooth-extraction', 'dentures'],
    bookingServiceSlug: 'implant-consultation',
    ctaLabel: 'Book an implant consultation',
    searchTerms: [
      'implant',
      'implants',
      'dental implant',
      'missing tooth',
      'replace missing tooth',
      'tooth replacement',
      'permanent tooth replacement',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'teeth-whitening',
    name: 'Teeth whitening',
    category: 'cosmetic',
    summary:
      'Professionally supervised whitening, with custom trays made to fit your teeth.',
    intro:
      'Whitening lightens the natural colour of your teeth using a controlled gel. Done under supervision with trays made to fit you, it is predictable and the strength can be matched to how sensitive your teeth are.',
    explanation: [
      'The gel works by breaking down staining within the tooth itself, which is why it changes the underlying colour rather than just polishing the surface. We take impressions and have thin, close-fitting trays made, so the gel stays on the teeth and off the gums.',
      'Results vary between people, and that is worth saying plainly. Natural tooth colour, the type of staining and your starting shade all affect the outcome. Teeth that are darker because of an injury or internal staining respond differently from teeth stained by tea, coffee or smoking.',
      'Whitening does not change the colour of crowns, veneers or fillings. If you have any of those in a visible position, we plan around them, because whitening the natural teeth around an existing crown can leave it looking out of place.',
      'Not everyone is suited to whitening. Active decay or gum disease needs treating first, and there are situations where we would recommend against it. That is the purpose of the consultation: to check suitability before you spend anything on treatment.',
    ],
    suitableFor: [
      'Teeth that have darkened gradually with age',
      'Staining from tea, coffee, red wine or smoking',
      'Patients with healthy teeth and gums who would like a lighter shade',
      'Anyone preparing for an occasion who wants to plan the timing properly',
    ],
    whatHappens: [
      {
        title: 'Suitability assessment',
        detail:
          'We check for decay and gum problems, record your starting shade, and look at any existing crowns, veneers or fillings in the smile line.',
      },
      {
        title: 'Custom trays',
        detail:
          'Impressions or a scan are taken and thin trays are made specifically for your teeth, so the gel is held where it should be.',
      },
      {
        title: 'Fitting and instructions',
        detail:
          'We fit the trays, show you exactly how much gel to use, and agree how long to wear them for and over how many days.',
      },
      {
        title: 'Review',
        detail:
          'A follow-up to look at the result, compare against your starting shade and discuss how to maintain it.',
      },
    ],
    durationMinutes: 30,
    priceFromCents: 65_000,
    priceNote:
      'This is the consultation fee. The whitening system, including custom trays and gel, is quoted at the consultation once suitability is confirmed.',
    faqs: [
      {
        question: 'How long do the results last?',
        answer:
          'Usually one to three years, depending on diet and whether you smoke. Most people keep the shade with occasional top-up gel in their existing trays, which is far less expensive than starting again.',
      },
      {
        question: 'Will whitening make my teeth sensitive?',
        answer:
          'Some people experience temporary sensitivity to cold during treatment, which settles once it finishes. It can usually be managed by reducing wear time or using a desensitising toothpaste alongside. Tell us if your teeth are already sensitive and we will adjust the plan.',
      },
      {
        question: 'Will it whiten my crowns and fillings?',
        answer:
          'No. Whitening only affects natural tooth. This matters if you have visible crowns, veneers or white fillings, because the natural teeth around them will change and they will not. We plan for this before starting.',
      },
      {
        question: 'Why not just buy a whitening product over the counter?',
        answer:
          'The main differences are a tray that actually fits, a gel strength matched to your teeth, and someone checking first that whitening is appropriate for you. A poorly fitting tray lets gel onto the gums, which is uncomfortable and gives uneven results.',
      },
    ],
    relatedTreatmentSlugs: ['professional-cleaning', 'composite-bonding', 'veneers'],
    bookingServiceSlug: 'whitening-consultation',
    ctaLabel: 'Book a whitening consultation',
    searchTerms: [
      'whitening',
      'teeth whitening',
      'white teeth',
      'bleaching',
      'yellow teeth',
      'stained teeth',
      'brighter smile',
      'discoloured teeth',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'composite-bonding',
    name: 'Composite bonding',
    category: 'cosmetic',
    summary:
      'Tooth-coloured material shaped directly onto a tooth to improve its form in one visit.',
    intro:
      'Composite bonding reshapes a tooth by adding tooth-coloured material directly onto it. It is done in a single appointment, usually without removing any healthy tooth, which makes it one of the most conservative cosmetic options.',
    explanation: [
      'Bonding is well suited to small changes: closing a narrow gap, rebuilding a chipped corner, evening up a tooth that is slightly shorter than its neighbour, or softening an edge that looks worn. The composite is applied in layers, shaped by hand and polished.',
      'Because little or no tooth is removed, bonding is largely reversible, and that is its main advantage over veneers. It also costs less and is finished the same day. The trade-off is that composite is not as strong or as stain-resistant as porcelain, so it needs more maintenance over time.',
      'The result depends a great deal on the shaping, which is done by eye and by hand at the chair. We will talk through what is realistic for your teeth before starting, and for anything involving several front teeth we plan the shape together first.',
    ],
    suitableFor: [
      'Small chips and worn edges on front teeth',
      'Closing a small gap between two teeth',
      'Evening up teeth that differ slightly in length or width',
      'Patients who would prefer to avoid removing healthy tooth',
    ],
    whatHappens: [
      {
        title: 'Planning the shape',
        detail:
          'We look at the tooth alongside its neighbours and agree what change you are after. Photographs help here.',
      },
      {
        title: 'Shade matching',
        detail:
          'The composite shade is matched to your tooth in natural light, before the tooth dries out and lightens.',
      },
      {
        title: 'Building and shaping',
        detail:
          'The surface is prepared, then composite is bonded in layers and shaped directly on the tooth.',
      },
      {
        title: 'Polishing',
        detail:
          'The surface is contoured and polished to a natural lustre, and the bite is checked.',
      },
    ],
    durationMinutes: 60,
    priceFromCents: 220_000,
    priceNote:
      'Per tooth. Treating several teeth together is quoted as a single plan.',
    faqs: [
      {
        question: 'How long does bonding last?',
        answer:
          'Commonly three to seven years before it needs refreshing or repolishing. Edges can chip and the surface can pick up stain over time. Repairs are usually straightforward.',
      },
      {
        question: 'Bonding or veneers?',
        answer:
          'Bonding is less expensive, done in one visit and removes little or no tooth. Veneers last longer, resist staining better and can achieve a bigger change. For small corrections bonding is often the better value; for a substantial change to shape or colour, veneers may be more appropriate.',
      },
      {
        question: 'Will it stain?',
        answer:
          'Composite picks up stain more readily than natural enamel, particularly from coffee, tea, red wine and smoking. A polish at your hygiene visits keeps it looking fresh.',
      },
      {
        question: 'Should I whiten first?',
        answer:
          'Yes, if you are considering both. Composite cannot be whitened afterwards, so it is matched to your final shade. Whitening first and bonding second gives the better result.',
      },
    ],
    relatedTreatmentSlugs: ['veneers', 'teeth-whitening', 'fillings'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a bonding consultation',
    searchTerms: [
      'bonding',
      'composite bonding',
      'chipped tooth',
      'chipped front tooth',
      'gap between teeth',
      'uneven teeth',
      'worn teeth',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'veneers',
    name: 'Veneers',
    category: 'cosmetic',
    summary:
      'Thin porcelain facings bonded to the front of teeth to change shape and colour.',
    intro:
      'A veneer is a thin shell of porcelain bonded to the front surface of a tooth. Veneers change shape, colour and alignment in a way that whitening or bonding cannot, and they are made individually in a laboratory.',
    explanation: [
      'Veneers are a considered treatment rather than a quick fix. A small amount of enamel is usually removed so the veneer sits flush and does not look thick, and because enamel does not grow back, that step is not reversible. We want you to understand that clearly before starting.',
      'Planning is the most important part. We take photographs, records of how your teeth meet, and often make a trial version you can see in your own mouth before anything permanent is done. That way the shape, length and shade are agreed by you rather than decided for you.',
      'Porcelain holds its colour and resists staining well, which is the main advantage over composite. Veneers are not indestructible: they can chip or come away under heavy load, and if you grind your teeth we will discuss a night guard as part of the plan.',
      'Veneers are not right for every situation. Where teeth are heavily broken down a crown may be more appropriate, and where the issue is alignment, orthodontic treatment may give a better and more conservative result. We will say so if that applies.',
    ],
    suitableFor: [
      'Teeth that are discoloured in a way whitening will not address',
      'Changing the shape or width of front teeth',
      'Closing gaps where bonding would not be enough',
      'Worn front teeth that need rebuilding and improving in appearance',
    ],
    whatHappens: [
      {
        title: 'Consultation and records',
        detail:
          'Photographs, scans and a discussion of what you want to change. We are explicit about what is and is not achievable.',
      },
      {
        title: 'Trial design',
        detail:
          'Where appropriate we make a trial version you can see and approve in your own mouth before any tooth is prepared.',
      },
      {
        title: 'Preparation',
        detail:
          'A small amount of enamel is shaped, the teeth are scanned, and temporary veneers are fitted while the laboratory works.',
      },
      {
        title: 'Fitting',
        detail:
          'The veneers are tried in so you can see them before they are bonded, then bonded in place and the bite checked.',
      },
    ],
    durationMinutes: 60,
    priceFromCents: 950_000,
    priceNote:
      'Per tooth, including laboratory work. Veneers are almost always planned across several teeth, and a written plan with the total is provided before treatment starts.',
    faqs: [
      {
        question: 'How long do veneers last?',
        answer:
          'Often ten to fifteen years, and sometimes longer. They may need replacing eventually, and because enamel was removed the tooth will always need some form of covering from then on. That is part of the decision.',
      },
      {
        question: 'Is having veneers painful?',
        answer:
          'Preparation is done under local anaesthetic. Some sensitivity while temporaries are in place is common and settles once the final veneers are bonded.',
      },
      {
        question: 'Can I have a single veneer?',
        answer:
          'Yes, although matching one veneer to the natural teeth either side is technically demanding. Treating two or more often gives a more harmonious result. We will give you an honest view for your teeth.',
      },
      {
        question: 'Do veneers stain?',
        answer:
          'Porcelain itself resists staining well. The margin where the veneer meets the tooth can pick up stain if cleaning is not thorough, so hygiene visits matter.',
      },
    ],
    relatedTreatmentSlugs: ['composite-bonding', 'crowns', 'teeth-whitening'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a veneer consultation',
    searchTerms: [
      'veneer',
      'veneers',
      'porcelain veneers',
      'smile makeover',
      'front teeth',
      'discoloured front teeth',
      'crooked teeth appearance',
    ],
    supportsPaymentPlan: true,
  },
  {
    slug: 'emergency-dentistry',
    name: 'Emergency dentistry',
    category: 'emergency',
    summary:
      'Same-day appointments held back each morning for pain, swelling and broken teeth.',
    intro:
      'Dental pain is difficult to ignore and difficult to wait out. We hold appointments back each morning for urgent problems, so that someone in pain can usually be seen the same day.',
    explanation: [
      'An emergency appointment has one purpose: work out what is causing the problem and get you comfortable. That might mean settling an infection, dressing an exposed tooth, repairing a fracture temporarily, or re-cementing a crown that has come off.',
      'Definitive treatment does not always happen at the same visit, and that is deliberate. Getting you out of pain and stabilising the situation comes first. We then plan the permanent repair properly rather than rushing it.',
      'If you have had an injury and a tooth has been knocked out, time matters. Keep the tooth moist, ideally in milk or held in the cheek, do not scrub it, and phone us straight away.',
    ],
    suitableFor: [
      'Toothache that is keeping you awake or not responding to pain relief',
      'Swelling around a tooth or in the face',
      'A broken, cracked or knocked-out tooth',
      'A crown, filling or bridge that has come loose or come off',
      'Pain after recent dental treatment',
    ],
    whatHappens: [
      {
        title: 'Telephone triage',
        detail:
          'When you call we ask a few questions to work out how urgently you need to be seen and what to do in the meantime.',
      },
      {
        title: 'Focused examination',
        detail:
          'We concentrate on the problem area, test the tooth and take an image if needed to find the cause.',
      },
      {
        title: 'Getting you comfortable',
        detail:
          'Treatment aimed at relieving the immediate problem, which may be draining an infection, dressing the tooth, or a temporary repair.',
      },
      {
        title: 'Plan for the permanent repair',
        detail:
          'We explain what caused it, what definitive treatment is needed, and book that at a normal appointment.',
      },
    ],
    durationMinutes: 30,
    priceFromCents: 110_000,
    priceNote:
      'The emergency consultation fee covers assessment and immediate relief. Any further treatment is quoted before it is carried out.',
    faqs: [
      {
        question: 'Can I be seen today?',
        answer:
          'Usually. Appointments are held back each morning for urgent cases. The booking page shows the genuinely earliest available times, and phoning reception is the fastest route if nothing suitable appears.',
      },
      {
        question: 'What should I do while I wait?',
        answer:
          'Over-the-counter pain relief taken as directed on the packet usually helps. A cold compress against the cheek can ease swelling. Avoid very hot or very cold food and drink, and do not put aspirin directly onto the gum.',
      },
      {
        question: 'Is this a substitute for a hospital emergency department?',
        answer:
          'No. We are a dental practice. For a suspected fracture to the jaw or face, uncontrolled bleeding, difficulty breathing or swallowing, or swelling closing your eye or throat, go to your nearest hospital emergency department or call 10177.',
      },
      {
        question: 'My tooth has been knocked out, what now?',
        answer:
          'Phone us immediately. Hold the tooth by the crown and not the root, do not scrub it, and keep it moist in milk or in your cheek. Time makes a real difference to whether it can be saved.',
      },
    ],
    relatedTreatmentSlugs: ['root-canal-treatment', 'tooth-extraction', 'crowns'],
    bookingServiceSlug: 'emergency-consultation',
    ctaLabel: 'Find the earliest appointment',
    searchTerms: [
      'emergency',
      'urgent',
      'toothache',
      'tooth ache',
      'pain',
      'severe pain',
      'swelling',
      'abscess',
      'broken tooth',
      'knocked out tooth',
      'lost filling',
      'crown came off',
      'bleeding',
      'same day',
    ],
    supportsPaymentPlan: false,
  },
  {
    slug: 'gum-health',
    name: 'Gum health',
    category: 'hygiene',
    summary:
      'Assessment and treatment for bleeding gums and the bone loss that can follow.',
    intro:
      'Gum disease is common, usually painless in its early stages, and the leading reason adults lose teeth. Bleeding when you brush is the signal most often missed. Treated early it is very manageable.',
    explanation: [
      'Gum disease begins as inflammation caused by bacteria sitting against the gum. At that stage it is reversible with thorough cleaning. If it progresses, the attachment between tooth and bone starts to break down, pockets form, and bone is lost. Bone that has gone does not come back, which is why acting early matters so much.',
      'Assessment means measuring the depth of the space around each tooth and recording where there is bleeding. Those numbers give a baseline, and comparing them at later visits is how we know whether treatment is working.',
      'Treatment is thorough cleaning below the gum line, sometimes over more than one appointment and sometimes with local anaesthetic, followed by maintenance at an interval set by how your gums respond. A large part of the outcome depends on cleaning at home, so we spend time on technique specific to the areas that are affected.',
      'Smoking and diabetes both make gum disease harder to control, and gum problems can be the first sign of an undiagnosed issue elsewhere. If anything we see suggests that, we will say so and suggest you speak to your doctor.',
    ],
    suitableFor: [
      'Gums that bleed when brushing or flossing',
      'Persistent bad breath or a bad taste',
      'Gums that have receded, or teeth that look longer than before',
      'Teeth that feel loose or have shifted position',
      'Anyone previously told they have gum disease and needs ongoing maintenance',
    ],
    whatHappens: [
      {
        title: 'Detailed assessment',
        detail:
          'We measure around each tooth and record bleeding and recession, creating a baseline chart to compare against later.',
      },
      {
        title: 'Explaining the findings',
        detail:
          'We show you your own chart and images, so the pattern and where the problem areas are is clear.',
      },
      {
        title: 'Cleaning below the gum line',
        detail:
          'Thorough removal of deposits from within the pockets, under local anaesthetic where needed, often across more than one appointment.',
      },
      {
        title: 'Maintenance plan',
        detail:
          'A re-assessment to measure the response, then a maintenance interval set by how your gums have reacted rather than by a default.',
      },
    ],
    durationMinutes: 60,
    priceFromCents: 165_000,
    priceNote:
      'A full assessment and treatment course is quoted after the initial charting, because the number of appointments depends on how much of the mouth is affected.',
    faqs: [
      {
        question: 'Is bleeding when I brush normal?',
        answer:
          'No. Healthy gums do not bleed when brushed. Bleeding is the earliest reliable sign of inflammation and it is worth having looked at, particularly because at that stage it is usually entirely reversible.',
      },
      {
        question: 'Can gum disease be cured?',
        answer:
          'Early inflammation can be fully reversed. Once bone has been lost, the aim shifts to stopping further loss and keeping things stable, which is achievable but needs ongoing maintenance rather than a one-off treatment.',
      },
      {
        question: 'Will my gums grow back?',
        answer:
          'Gum that has receded does not generally return on its own, and lost bone does not regenerate. That is precisely why treating early is worth the effort.',
      },
      {
        question: 'How often will I need to come in?',
        answer:
          'Once things are stable, every three to four months is typical for someone with a history of gum disease, compared with every six months for routine hygiene. The interval is set by your own response.',
      },
    ],
    relatedTreatmentSlugs: ['professional-cleaning', 'dental-examination', 'tooth-extraction'],
    bookingServiceSlug: 'general-consultation',
    ctaLabel: 'Book a gum assessment',
    searchTerms: [
      'gum',
      'gums',
      'bleeding gums',
      'gum disease',
      'gingivitis',
      'periodontitis',
      'receding gums',
      'bad breath',
      'loose teeth',
      'sore gums',
      'swollen gums',
    ],
    supportsPaymentPlan: false,
  },
];

/** Look up a treatment by slug. */
export function getTreatment(slug: string): Treatment | undefined {
  return treatments.find((t) => t.slug === slug);
}

/** Treatments shown on the homepage, in display order. */
export const popularTreatmentSlugs = [
  'dental-examination',
  'professional-cleaning',
  'teeth-whitening',
  'fillings',
  'dental-implant-consultation',
  'emergency-dentistry',
] as const;

export function popularTreatments(): Treatment[] {
  return popularTreatmentSlugs
    .map((slug) => getTreatment(slug))
    .filter((t): t is Treatment => t !== undefined);
}

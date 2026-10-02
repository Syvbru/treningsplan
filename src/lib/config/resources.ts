export const styrkeProgrammer = [
	{ title: 'Styrke med vekter', url: '/pdf/StyrkeMedVekter.pdf' },
	{ title: 'Styrke uten vekter', url: '/pdf/StyrkeUtenVekter.pdf' },
	{ title: 'Styrke vinter', url: '/pdf/StyrkeVinter.pdf' },
	{ title: 'Kort styrkeøkt overkropp', url: '/pdf/KortStyrkeøktOverkropp.pdf' },
	{ title: 'Kort styrkeøkt ben', url: '/pdf/KortStyrkeøktBen.pdf' }
];

type TeknikkVideo = {
	url: string; // YouTube video-ID
	stilart: 'Skate' | 'Klassisk';
	teknikk: string; // f.eks. "Diagonal", "Staking", "Dobbeldans", "Padling"
};

// Legg til / fjern videoer her – visningen under bygges automatisk med #each
export const teknikkVideoer: TeknikkVideo[] = [
	{ url: 'Z2oNfG4eulQ', stilart: 'Klassisk', teknikk: 'Diagonal' },
	{ url: 'NNR6YpFA7Jw', stilart: 'Klassisk', teknikk: 'Diagonal' },
	{ url: 'D_hlp-buPhA', stilart: 'Klassisk', teknikk: 'Staking' },
	{ url: 'MYVK4agNPcE', stilart: 'Klassisk', teknikk: 'Staking' },
	{ url: '7SZn1vDG_WY', stilart: 'Klassisk', teknikk: 'Dobbeltak med fraspark' },
	{ url: 'PlFkOEr7bw0', stilart: 'Skate', teknikk: 'Dobbeldans' },
	{ url: 'G-vIb6gzYRk', stilart: 'Skate', teknikk: 'Dobbeldans' },
	{ url: 'Z6ynMU7KixA', stilart: 'Skate', teknikk: 'Padling' },
	{ url: '-eWpFQ9rDos', stilart: 'Skate', teknikk: 'Padling' },
	{ url: '8PLC-KWs4c0', stilart: 'Skate', teknikk: 'Enkeldans' },
	{ url: 'QWZp2WVukkY', stilart: 'Skate', teknikk: 'Enkeldans' }
];

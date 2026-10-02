export const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const VIDEO_MAX_COUNT = 6;
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export function validateVideoFiles(files: Pick<File, 'type' | 'size'>[], existing = 0): void {
	if (files.length + existing > VIDEO_MAX_COUNT) throw new Error('Maks 6 videoer per logg.');
	if (files.some((f) => !VIDEO_TYPES.includes(f.type)))
		throw new Error('Velg MP4, MOV eller WebM-videoer.');
	if (files.some((f) => f.size <= 0 || f.size > VIDEO_MAX_BYTES))
		throw new Error('Videoer må være mellom 1 byte og 100 MB.');
}
export function cloudinaryThumb(url: string): string {
	return url
		.replace('/video/upload/', '/video/upload/so_0,w_640/')
		.replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg');
}

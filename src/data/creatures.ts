export type Tier = "S" | "A" | "B" | "C" | "D";

export interface CreatureStats {
  strength: number;     // Sức mạnh cơ bắp / lực tấn công
  durability: number;   // Độ bền / khả năng chịu đòn
  speed: number;        // Tốc độ di chuyển
  weaponry: number;     // Vũ khí (vuốt, độc, hàm...)
  special: number;      // Khả năng đặc biệt (độc, tái sinh, ngụy trang...)
  lethality: number;    // Độ nguy hiểm tổng thể
}

export interface Creature {
  id: string;
  name: string;
  scientificName: string;
  taxonomy: {
    class: string;
    order: string;
    family: string;
  };
  realWeight: string;
  size: string;             // raw size (NEW)
  characteristics: string;  // đặc điểm (NEW)
  habitat: string;
  location: string;         // vị trí/phân bố (NEW)
  survival_method: string;  // cách thức sinh tồn (NEW)
  unique_traits: string;    // điểm đặc biệt (NEW)
  shortDescription: string;
  description: string;
  stats: CreatureStats;
  p4pScore: number;
  tier: Tier;
  strengths: string[];
  weaknesses: string[];
  funFacts: string[];
  sources: { label: string; url: string }[];
  imageColor: string; // fallback gradient color
  enrichmentCount?: number;
  diet_type?: "carnivore" | "herbivore" | "omnivore" | "detritivore" | "parasitic";
  diet_items?: string[];
  activity_pattern?: "diurnal" | "nocturnal" | "crepuscular" | "variable";
  lifespan_min?: number;
  lifespan_max?: number;
  lifespan_unit?: "years" | "months" | "days";
  reproduction_type?: "sexual" | "asexual" | "hermaphrodite" | "oviparous" | "viviparous";
  reproduction_notes?: string;
  locomotion?: "swim" | "walk" | "fly" | "crawl" | "burrow" | "hybrid";
  speed_max?: number;
  conservation_status?: "LC" | "NT" | "VU" | "EN" | "CR" | "EX";
  size_min_mm?: number;
  size_max_mm?: number;
  weight_avg_g?: number;
  hasDocumentary?: boolean;
  gradingCount?: number;
  aiP4pScore?: number;
  aiTier?: Tier;
  communityP4pScore?: number;
  communityTier?: Tier;
}

export const creatures: Creature[] = [
  {
    id: "bullet-ant",
    name: "Kiến Đạn",
    scientificName: "Paraponera clavata",
    taxonomy: {
      class: "Insecta",
      order: "Hymenoptera",
      family: "Paraponerinae",
    },
    realWeight: "~0.1g",
    size: "18–30 mm",
    characteristics: "Thân màu đen hoặc đỏ sẫm, kiến thợ có hàm nhai (mandibles) lớn, ngòi châm dài chứa nọc độc poneratoxin.",
    habitat: "Rừng nhiệt đới Trung và Nam Mỹ",
    location: "Rừng mưa nhiệt đới từ Nicaragua đến Paraguay.",
    survival_method: "Sống bầy đàn trong tổ dưới gốc cây, ăn mật hoa và côn trùng nhỏ, tự vệ bằng nọc đốt đau đớn để xua đuổi thú săn mồi lớn.",
    unique_traits: "Sở hữu cú đốt độc lập đạt cấp độ cao nhất trong thang Schmidt, khả năng kêu 'rè rè' khi bị đe dọa.",
    shortDescription: "Vết đốt đau nhất trong thế giới côn trùng. Đau 24 giờ không ngừng.",
    description:
      "Kiến Đạn là một trong những sinh vật đáng sợ nhất nếu xét theo tỉ lệ kích thước. Vết đốt của nó được đánh giá cấp 4+ trên thang Schmidt — cấp cao nhất, vượt qua ong bắp cày và tất cả các loài côn trùng khác. Nếu quy về cùng cân nặng với con người, lực đốt và sức kéo của nó thuộc hàng thượng đỉnh trong tự nhiên.",
    stats: {
      strength: 95,
      durability: 65,
      speed: 70,
      weaponry: 99,
      special: 80,
      lethality: 88,
    },
    p4pScore: 83,
    tier: "S",
    strengths: [
      "Nọc độc Poneratoxin gây đau cực mạnh, tê liệt thần kinh",
      "Sức kéo gấp 30 lần trọng lượng cơ thể",
      "Hàm mandible cực mạnh, khóa chặt không nhả",
      "Phản ứng hóa học — phối hợp đàn theo pheromone tức thời",
    ],
    weaknesses: [
      "Kích thước thật sự quá nhỏ — dễ bị đè bẹp",
      "Chỉ hoạt động hiệu quả theo đàn",
      "Chậm hơn nhiều loài côn trùng khác",
    ],
    funFacts: [
      "Thổ dân Sateré-Mawé dùng kiến đạn trong nghi lễ trưởng thành — đeo găng tay nhồi 80 con kiến trong 10 phút",
      "Vết đốt gây đau liên tục 12–24 giờ, cảm giác như trúng đạn",
      "Mỗi con có thể đốt nhiều lần — không như ong chết sau khi đốt",
    ],
    sources: [
      { label: "Schmidt Pain Index", url: "https://doi.org/10.1016/0041-0101(90)90096-4" },
      { label: "Poneratoxin research", url: "https://pubmed.ncbi.nlm.nih.gov/15936249/" },
    ],
    imageColor: "#8B1A1A",
    diet_type: "omnivore",
    diet_items: ["mật hoa", "côn trùng nhỏ", "nhựa cây"],
    activity_pattern: "diurnal",
    lifespan_min: 3,
    lifespan_max: 5,
    lifespan_unit: "months",
    reproduction_type: "sexual",
    reproduction_notes: "Sinh sản lưỡng tính thụ tinh qua kiến chúa, kiến thợ là kiến cái bất thụ.",
    locomotion: "walk",
    speed_max: 0.1,
    conservation_status: "LC",
    size_min_mm: 18,
    size_max_mm: 30,
    weight_avg_g: 0.05
  },
  {
    id: "mantis-shrimp",
    name: "Tôm Bọ Ngựa",
    scientificName: "Odontodactylus scyllarus",
    taxonomy: {
      class: "Malacostraca",
      order: "Stomatopoda",
      family: "Odontodactylidae",
    },
    realWeight: "~100g",
    size: "18–30 cm (có thể đạt 38cm)",
    characteristics: "Vỏ ngoài sặc sỡ đa sắc, có cặp càng búa dập cực mạnh hoạt động như lò xo nén.",
    habitat: "Vùng biển nhiệt đới Ấn Độ Dương và Thái Bình Dương",
    location: "Vùng biển nhiệt đới Indo-Pacific từ Đông Phi đến Hawaii.",
    survival_method: "Đào hang sâu dưới đáy cát/san hô, săn mồi đơn độc bằng cách rình rập và tung đòn đập vỡ lớp vỏ cứng của cua, ốc.",
    unique_traits: "Cú đấm siêu thanh tạo bong bóng cavitation nhiệt độ mặt trời, thị giác phức tạp nhất thế giới động vật với 16 thụ thể màu sắc.",
    shortDescription: "Đấm nhanh hơn viên đạn. Tạo ra plasma khi tấn công.",
    description:
      "Tôm Bọ Ngựa sở hữu cú đấm mạnh nhất tính theo tỉ lệ cơ thể trong tự nhiên. Tốc độ đánh đạt 23 m/s — nhanh hơn viên đạn súng ngắn. Va chạm tạo ra cavitation bubble đạt nhiệt độ bề mặt mặt trời (~5500°C thoáng qua) và sóng xung kích. Mắt của nó nhìn thấy 16 loại màu trong khi con người chỉ thấy 3.",
    stats: {
      strength: 85,
      durability: 80,
      speed: 98,
      weaponry: 97,
      special: 95,
      lethality: 90,
    },
    p4pScore: 91,
    tier: "S",
    strengths: [
      "Cú đấm nhanh nhất trong tự nhiên: 23 m/s, lực 1500 Newton",
      "Tạo cavitation plasma ~5500°C khi tấn công",
      "Giáp exoskeleton đặc biệt — chịu được va đập cực lớn",
      "Thị lực 16 kênh màu — nhìn thấy tia UV, hồng ngoại",
    ],
    weaknesses: [
      "Môi trường sống giới hạn trong nước",
      "Kích thước cơ thể nhỏ thật sự (~30cm)",
      "Hung hăng quá mức — tự gây thương tích trong bể nuôi",
    ],
    funFacts: [
      "Các nhà nghiên cứu Harvard đang nghiên cứu cấu trúc càng của nó để chế tạo giáp xe tăng",
      "Có thể đập vỡ kính bể cá — người nuôi phải dùng kính cường lực đặc biệt",
      "Mỗi cú đấm tương đương bắn một viên đạn 0.22 caliber",
    ],
    sources: [
      { label: "Patek et al. - Strike mechanics", url: "https://doi.org/10.1098/rspb.2004.2840" },
      { label: "Nature - Mantis shrimp club", url: "https://doi.org/10.1038/nature10092" },
    ],
    imageColor: "#1A4A6B",
    diet_type: "carnivore",
    diet_items: ["cua đá", "ốc biển", "cá nhỏ", "giáp xác"],
    activity_pattern: "diurnal",
    lifespan_min: 3,
    lifespan_max: 7,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Thụ tinh ngoài, một số loài chung thủy một vợ một chồng suốt đời.",
    locomotion: "hybrid",
    speed_max: 10.0,
    conservation_status: "LC",
    size_min_mm: 180,
    size_max_mm: 380,
    weight_avg_g: 120.0
  },
  {
    id: "blue-ringed-octopus",
    name: "Bạch Tuộc Đốm Xanh",
    scientificName: "Hapalochlaena lunulata",
    taxonomy: {
      class: "Cephalopoda",
      order: "Octopoda",
      family: "Octopodidae",
    },
    realWeight: "~30g",
    size: "12–20 cm",
    characteristics: "Màu da vàng nhạt với các đốm xanh dương phát sáng nhảy múa khi bị đe dọa, thân mềm không xương.",
    habitat: "Vùng biển San hô Thái Bình Dương và Ấn Độ Dương",
    location: "Các rạn san hô và hồ triều ở Thái Bình Dương và Ấn Độ Dương.",
    survival_method: "Săn cua, tôm đêm bằng cách phun nước chứa nọc Tetrodotoxin làm tê liệt con mồi từ xa hoặc cắn trực tiếp.",
    unique_traits: "Nọc độc cộng sinh cực mạnh không có thuốc giải, có thể đổi màu ngụy trang hòa mình vào san hô chỉ trong tích tắc.",
    shortDescription: "Đủ nọc để giết 26 người trưởng thành. Không có thuốc giải.",
    description:
      "Bạch Tuộc Đốm Xanh là một trong những sinh vật độc nhất trên Trái Đất. Nọc Tetrodotoxin (TTX) của nó mạnh hơn cyanide 1200 lần. Không màu, không mùi, không đau khi bị cắn — nạn nhân chỉ biết mình bị nhiễm khi đã tê liệt. Không có thuốc giải. Cách duy nhất sống sót là hô hấp nhân tạo trong nhiều giờ.",
    stats: {
      strength: 20,
      durability: 30,
      speed: 60,
      weaponry: 100,
      special: 98,
      lethality: 99,
    },
    p4pScore: 78,
    tier: "A",
    strengths: [
      "TTX mạnh hơn cyanide 1200 lần, không có thuốc giải",
      "Đủ nọc giết 26 người — từ 1 con 30 gram",
      "Ngụy trang hoàn hảo, khó phát hiện cho đến khi quá muộn",
      "Đốm xanh phát sáng là cảnh báo — nhưng nhiều người không biết",
    ],
    weaknesses: [
      "Cực kỳ yếu về thể chất — không có sức mạnh cơ bắp",
      "Chỉ gây chết trong nước hoặc tiếp xúc trực tiếp",
      "Vũ khí chủ yếu là phòng thủ, không phải tấn công chủ động",
    ],
    funFacts: [
      "Đốm xanh iridescent không phải màu thật — là cấu trúc quang học như cánh bướm",
      "Tetrodotoxin không do bạch tuộc tổng hợp — từ vi khuẩn cộng sinh trong cơ thể nó",
      "Nọc đủ giết người trong 30 phút nhưng không có triệu chứng đau",
    ],
    sources: [
      { label: "TTX toxicology", url: "https://pubmed.ncbi.nlm.nih.gov/23206318/" },
      { label: "Blue-ringed octopus venom", url: "https://doi.org/10.1016/j.toxicon.2011.01.005" },
    ],
    imageColor: "#0A3D5C",
    diet_type: "carnivore",
    diet_items: ["cua nhỏ", "tôm biển", "cá nhỏ"],
    activity_pattern: "nocturnal",
    lifespan_min: 1,
    lifespan_max: 2,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Giao phối hữu tính, cả con đực và con cái đều chết ngay sau chu kỳ sinh sản.",
    locomotion: "hybrid",
    speed_max: 5.0,
    conservation_status: "LC",
    size_min_mm: 120,
    size_max_mm: 200,
    weight_avg_g: 30.0
  },
  {
    id: "goliath-beetle",
    name: "Bọ Hung Goliath",
    scientificName: "Goliathus goliatus",
    taxonomy: {
      class: "Insecta",
      order: "Coleoptera",
      family: "Scarabaeidae",
    },
    realWeight: "~100g",
    size: "60–110 mm (con đực)",
    characteristics: "Cơ thể to lớn cứng cáp với hoa văn đen trắng đặc trưng trên ngực, con đực có sừng chữ Y lớn.",
    habitat: "Rừng nhiệt đới Trung Phi",
    location: "Rừng nhiệt đới xích đạo châu Phi.",
    survival_method: "Ăn nhựa cây và trái cây chín, sử dụng lớp giáp exoskeleton siêu dày để chống chọi kẻ thù, dùng sừng làm đòn bẩy hất văng đối thủ.",
    unique_traits: "Là một trong những loài côn trùng nặng nhất thế giới, sức nâng cơ học phi thường so với trọng lượng.",
    shortDescription: "Côn trùng nặng nhất thế giới. Bay được dù nặng như quả táo.",
    description:
      "Bọ Hung Goliath là côn trùng nặng nhất thế giới — con đực trưởng thành có thể đạt 100g và dài 11cm. Điều đáng kinh ngạc là nó vẫn bay được dù có ngoại cốt bộ dày và nặng nề. Sừng trên đầu dùng để cắm vào kẻ địch và lật ngược — đây là vũ khí chứ không phải trang trí.",
    stats: {
      strength: 90,
      durability: 88,
      speed: 55,
      weaponry: 78,
      special: 40,
      lethality: 45,
    },
    p4pScore: 66,
    tier: "B",
    strengths: [
      "Sức kéo gấp 850 lần trọng lượng cơ thể — mạnh nhất trong côn trùng",
      "Giáp exoskeleton cực dày, chịu được áp lực lớn",
      "Sừng như cái xẻng — lật và cắm xuyên kẻ địch",
      "Bay được — cơ động bất ngờ với kích thước đó",
    ],
    weaknesses: [
      "Không có nọc độc hay vũ khí hóa học",
      "Tốc độ chậm, phản ứng kém",
      "Dễ bị lật ngược — không tự dậy được",
    ],
    funFacts: [
      "Sức kéo tương đương một người đàn ông kéo xe tải 65 tấn",
      "Ấu trùng mất 1-2 năm để phát triển, ăn gỗ mục",
      "Thường được nuôi ở Nhật như thú cưng — giá vài triệu đồng/con",
    ],
    sources: [
      { label: "Insect strength research", url: "https://doi.org/10.1242/jeb.02455" },
      { label: "Goliath beetle biology", url: "https://www.britannica.com/animal/Goliath-beetle" },
    ],
    imageColor: "#2D4A1E",
    diet_type: "herbivore",
    diet_items: ["nhựa cây", "trái cây chín"],
    activity_pattern: "diurnal",
    lifespan_min: 6,
    lifespan_max: 12,
    lifespan_unit: "months",
    reproduction_type: "sexual",
    reproduction_notes: "Vòng đời biến thái hoàn toàn thông qua giai đoạn ấu trùng ăn gỗ mục dưới lòng đất.",
    locomotion: "hybrid",
    speed_max: 1.5,
    conservation_status: "LC",
    size_min_mm: 60,
    size_max_mm: 110,
    weight_avg_g: 80.0
  },
  {
    id: "emperor-scorpion",
    name: "Bọ Cạp Hoàng Đế",
    scientificName: "Pandinus imperator",
    taxonomy: {
      class: "Arachnida",
      order: "Scorpiones",
      family: "Scorpionidae",
    },
    realWeight: "~30g",
    size: "20–23 cm",
    characteristics: "Thân đen bóng loáng, cặp càng kẹp to khỏe xù xì, đuôi có ngòi độc nhưng nọc yếu.",
    habitat: "Rừng nhiệt đới và thảo nguyên Tây Phi",
    location: "Rừng nhiệt đới và thảo nguyên ẩm Tây Phi.",
    survival_method: "Sống trong hang tự đào hoặc dưới vỏ cây mục, kẹp nát con mồi bằng đôi càng khổng lồ thay vì chích nọc.",
    unique_traits: "Phát huỳnh quang màu xanh lục neon rực rỡ dưới ánh sáng tia cực tím (UV).",
    shortDescription: "Bọ cạp lớn nhất thế giới. Trông đáng sợ nhưng nọc nhẹ hơn ong.",
    description:
      "Bọ Cạp Hoàng Đế là loài bọ cạp lớn nhất thế giới — dài tới 23cm, nặng 30g. Nghịch lý ở chỗ: nhìn cực kỳ đáng sợ nhưng nọc độc lại yếu hơn ong. Chiến lược của nó là dùng kích thước và càng khổng lồ để ép chết con mồi — không dùng đuôi. Đây là ví dụ điển hình của intimidation over lethality.",
    stats: {
      strength: 75,
      durability: 70,
      speed: 50,
      weaponry: 65,
      special: 55,
      lethality: 40,
    },
    p4pScore: 59,
    tier: "B",
    strengths: [
      "Càng chelae cực mạnh — kẹp và ép chết con mồi",
      "Giáp exoskeleton cứng, phản chiếu UV",
      "Khả năng cảm nhận rung động đất — phát hiện mọi chuyển động",
      "Nocturnal hunter — săn đêm hiệu quả",
    ],
    weaknesses: [
      "Nọc yếu — chỉ nguy hiểm với người dị ứng",
      "Chậm chạp so với kích thước",
      "Dễ mất nước trong môi trường khô",
    ],
    funFacts: [
      "Phát huỳnh quang xanh lam dưới ánh đèn UV — nguyên nhân vẫn chưa rõ",
      "Mặc dù nọc yếu, chúng vẫn là loài bọ cạp phổ biến nhất trong ngành nuôi thú cưng kỳ lạ",
      "Con cái mang con trên lưng cho đến khi lột xác lần đầu",
    ],
    sources: [
      { label: "Scorpion venom comparison", url: "https://pubmed.ncbi.nlm.nih.gov/19913031/" },
      { label: "Pandinus imperator biology", url: "https://doi.org/10.1016/j.toxicon.2015.06.017" },
    ],
    imageColor: "#1A1A3E",
    diet_type: "carnivore",
    diet_items: ["dế", "mối", "côn trùng nhỏ", "chuột nhắt"],
    activity_pattern: "nocturnal",
    lifespan_min: 5,
    lifespan_max: 8,
    lifespan_unit: "years",
    reproduction_type: "viviparous",
    reproduction_notes: "Sinh con trực tiếp (viviparous), mang con con trên lưng bảo vệ đến khi lột xác lần đầu.",
    locomotion: "walk",
    speed_max: 2.0,
    conservation_status: "LC",
    size_min_mm: 200,
    size_max_mm: 230,
    weight_avg_g: 30.0
  },
  {
    id: "yeti-crab",
    name: "Cua Tuyết Yeti",
    scientificName: "Kiwa hirsuta",
    taxonomy: {
      class: "Malacostraca",
      order: "Decapoda",
      family: "Kiwaidae"
    },
    realWeight: "~100 - 150 g",
    size: "15 cm",
    characteristics: "Thân hình đặc trưng của loài cua đá nhưng được bao phủ bởi lớp lông mịn màu vàng kem (setae) trên hai càng và chân bò. Đôi mắt thoái hóa hoàn toàn thành hai đốm nhỏ không có thấu kính do sống trong bóng tối vĩnh cửu.",
    habitat: "Vùng biển sâu tối tăm nhiệt độ cực hạn gần các miệng phun thủy nhiệt (hydrothermal vents) dưới độ sâu khoảng 2.200 mét.",
    location: "Vịnh Đông Thái Bình Dương (Easter Microplate), vùng biển phía nam Thái Bình Dương.",
    survival_method: "Sống bám quanh các lỗ phun thủy nhiệt, liên tục vẫy càng trong dòng nước giàu H2S và oxy để cung cấp chất dinh dưỡng cho vi khuẩn cộng sinh phát triển trên lông của mình, sau đó dùng các răng miệng chuyên biệt để cạo và ăn vi khuẩn.",
    unique_traits: "Khả năng \"trồng trọt\" vi khuẩn hóa tự dưỡng (chemoautotrophic bacteria) trên lớp lông mịn ở càng và chân, biến chúng thành nguồn thức ăn tự cấp. Sử dụng lớp lông này để hấp thụ và giải độc hóa chất hydro sulfide (H2S) cực độc từ miệng phun thủy nhiệt.",
    shortDescription: "Tự nuôi cấy vi khuẩn trên cơ thể bằng năng lượng núi lửa. Sống sót ở độ sâu 2.200m.",
    description: "Cua Tuyết Yeti (Kiwa hirsuta) được phát hiện vào năm 2005 tại vùng biển sâu Nam Thái Bình Dương. Đây là loài giáp xác kỳ lạ thích nghi hoàn hảo với môi trường khắc nghiệt quanh các miệng phun thủy nhiệt nhiệt độ cao và áp suất khổng lồ. Do sống ở nơi ánh sáng mặt trời không thể tới được, chúng không phụ thuộc vào chuỗi thức ăn quang hợp mà dựa vào năng lượng hóa tổng hợp. Lớp lông dày đặc ở hai chiếc càng dài chứa hàng triệu vi khuẩn sợi hóa tự dưỡng. Cua vẫy càng để luân chuyển dòng nước nóng giàu khoáng chất giúp vi khuẩn phát triển, đồng thời dùng lớp vi khuẩn này để trung hòa nồng độ chất độc hóa học xung quanh và biến chúng thành thức ăn chính.",
    stats: {
      strength: 45,
      durability: 80,
      speed: 15,
      weaponry: 40,
      special: 95,
      lethality: 30
    },
    p4pScore: 53,
    tier: "C",
    strengths: [
      "Khả năng tự cung tự cấp thức ăn nhờ nông trại vi khuẩn cộng sinh ngay trên cơ thể",
      "Khả năng chống chịu áp suất biển sâu cực đại ở độ sâu hơn 2.200 mét",
      "Lớp lông mịn hấp thụ và hóa giải hydro sulfide - một chất độc chết người đối với hầu hết các loài động vật",
      "Lớp vỏ kitin cứng cáp giúp chống chịu áp lực vật lý từ môi trường và kẻ thù"
    ],
    weaknesses: [
      "Mù hoàn toàn do mắt bị thoái hóa hoàn toàn trong bóng tối vĩnh cửu",
      "Phụ thuộc sinh tồn tuyệt đối vào các miệng phun thủy nhiệt, không thể sống xa nguồn nhiệt và hóa chất này",
      "Tốc độ di chuyển và phản xạ chậm chạp trong môi trường áp suất cao"
    ],
    funFacts: [
      "Khi được phát hiện lần đầu tiên, các nhà khoa học đã đặt tên chi của loài này là Kiwa theo tên của nữ thần giáp xác trong thần thoại Polynesia",
      "Mặc dù sống gần các miệng phun thủy nhiệt có nhiệt độ nước phun ra lên tới 350 độ C, cua Yeti chỉ sống ở vùng biên nước ấm từ 2 đến 30 độ C để tránh bị luộc chín",
      "Chúng sử dụng đôi càng đầy lông để quét và bắt các động vật thân mềm nhỏ bò quanh các kẽ đá núi lửa"
    ],
    sources: [
      {
        url: "https://doi.org/10.5194/bg-9-1959-2012",
        label: "Biogeosciences - Chemoautotrophic symbiosis of Yeti crabs"
      },
      {
        url: "https://www.nature.com/articles/news050307-3",
        label: "Nature - Furry lobster found in Deep Sea"
      }
    ],
    imageColor: "#F1F2F6",
    diet_type: "detritivore",
    diet_items: [
      "vi khuẩn hóa tự dưỡng",
      "mảnh vụn hữu cơ",
      "động vật thân mềm nhỏ"
    ],
    activity_pattern: "variable",
    lifespan_min: 10,
    lifespan_max: 20,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Đẻ trứng. Con cái mang trứng dưới bụng trong nhiều tháng và phải di chuyển xa khỏi các miệng phun thủy nhiệt có nồng độ sulfide cao để bảo vệ phôi thai khỏi ngộ độc trước khi trứng nở.",
    locomotion: "crawl",
    speed_max: 0.5,
    conservation_status: "LC",
    size_min_mm: 150.0,
    size_max_mm: 150.0,
    weight_avg_g: 120.0
  },
  {
    id: "echidna",
    name: "Thú Ăn Kiến Gai",
    scientificName: "Tachyglossus aculeatus",
    taxonomy: {
      class: "Mammalia",
      order: "Monotremata",
      family: "Tachyglossidae"
    },
    realWeight: "~2 - 7 kg",
    size: "30 - 45 cm",
    characteristics: "Thân hình tròn trịa được bao phủ bởi hỗn hợp lông xám nâu và các gai sừng nhọn hoắt màu vàng kem dài tới 5 cm. Đầu thuôn dài kết hợp mỏ nhỏ cứng cáp không có răng. Chân ngắn có bộ móng vuốt cong cực kỳ khỏe để đào bới.",
    habitat: "Rất đa dạng, từ rừng nhiệt đới ẩm, savan, cây bụi khô cằn đến vùng núi đá cao ôn đới.",
    location: "Toàn bộ lãnh thổ Úc và các vùng trũng phía nam đảo New Guinea.",
    survival_method: "Khi gặp nguy hiểm, chúng cuộn tròn thành một quả bóng gai nhọn hoắt hoặc đào bới đất cực nhanh để giấu phần bụng mềm dưới lòng đất, chỉ lộ lớp gai bảo vệ lên trên. Săn mồi bằng cách thọc mõm vào tổ kiến/mối, phóng chiếc lưỡi dài và dính ra để tớp thức ăn.",
    unique_traits: "Một trong hai loài thú đẻ trứng duy nhất còn tồn tại trên Trái Đất (cùng với thú mỏ vịt). Sở hữu mỏ chứa hơn 400 thụ thể điện sinh học (electroreceptors) cực kỳ nhạy bén giúp cảm nhận được dòng điện yếu sinh ra từ sự cơ động của kiến và mối trong lòng đất ẩm.",
    shortDescription: "Thú đẻ trứng kỳ lạ. Mỏ cảm biến điện trường định vị kiến dưới đất sâu.",
    description: "Thú Ăn Kiến Gai (Tachyglossus aculeatus) là một \"hóa thạch sống\" sinh học, đại diện cho bộ Thú đơn huyệt (Monotremata) cực kỳ cổ xưa. Khác với thú có nhau thai thông thường, echidna kết hợp đặc điểm của bò sát (đẻ trứng, cấu trúc xương bả vai) và thú (nuôi con bằng sữa, có lông). Chúng không có răng, thay vào đó sử dụng lưỡi phóng dính dài 18 cm chà sát thức ăn vào vòm miệng nhám để nghiền nát kiến và mối. Mỏ của echidna hoạt động như một máy phát hiện kim loại sinh học nhờ các tế bào thụ cảm điện trường độc đáo, giúp nó tìm ra nguồn thức ăn sâu dưới lòng đất ẩm. Thêm vào đó, khả năng điều hòa thân nhiệt thấp nhất trong các loài thú (khoảng 32°C) giúp chúng tiết kiệm năng lượng tối đa.",
    stats: {
      strength: 35,
      durability: 85,
      speed: 20,
      weaponry: 50,
      special: 92,
      lethality: 25
    },
    p4pScore: 52,
    tier: "C",
    strengths: [
      "Hệ thống phòng thủ gai sừng gai góc thách thức hầu hết kẻ săn mồi mặt đất",
      "Khả năng đào đất lẩn trốn thần tốc nhờ đôi chân móng vuốt siêu khỏe",
      "Mỏ cảm quan điện trường định vị con mồi dưới lòng đất cực kỳ chính xác",
      "Tuổi thọ sinh học cực cao đối với một loài thú có kích thước nhỏ"
    ],
    weaknesses: [
      "Khả năng chịu nhiệt kém, dễ bị sốc nhiệt nếu nhiệt độ môi trường vượt quá 38°C",
      "Tốc độ di chuyển trên mặt đất rất chậm và vụng về",
      "Không có răng và hàm yếu, giới hạn nguồn thức ăn chỉ có thể là côn trùng nhỏ, mềm"
    ],
    funFacts: [
      "Echidna đực sở hữu một dương vật bốn đầu vô cùng độc lạ, nhưng khi giao phối chúng chỉ sử dụng hai đầu thay phiên nhau",
      "Con non của loài này được gọi là 'puggle', chúng sống trong túi của mẹ khoảng 2 tháng cho đến khi bắt đầu mọc gai nhọn mới được đưa ra ngoài hang",
      "Chúng là những vận động viên bơi lội cừ khôi, có thể bơi qua các dòng sông lớn bằng cách giương cao mõm dài lên làm ống thở"
    ],
    sources: [
      {
        url: "https://doi.org/10.1098/rstb.1998.0267",
        label: "Philosophical Transactions of the Royal Society B - Electroreception in Monotremes"
      },
      {
        url: "https://www.nature.com/articles/342410a0",
        label: "Nature - Reproduction and lactation in echidnas"
      }
    ],
    imageColor: "#D2B48C",
    diet_type: "carnivore",
    diet_items: [
      "kiến",
      "mối",
      "ấu trùng côn trùng"
    ],
    activity_pattern: "variable",
    lifespan_min: 15,
    lifespan_max: 50,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Thú đẻ trứng. Con cái đẻ một quả trứng duy nhất có vỏ da mềm trực tiếp vào chiếc túi tạm thời trước bụng. Trứng nở sau 10 ngày, con non (puggles) sẽ liếm sữa tiết ra từ các tuyến sữa trong túi bụng của mẹ (do echidna không có núm vú).",
    locomotion: "hybrid",
    speed_max: 2.5,
    conservation_status: "LC",
    size_min_mm: 300.0,
    size_max_mm: 450.0,
    weight_avg_g: 4500.0
  },
  {
    id: "marbled-crayfish",
    name: "Tôm Hùm Đất Tự Nhân Bản",
    scientificName: "Procambarus virginalis",
    taxonomy: {
      class: "Malacostraca",
      order: "Decapoda",
      family: "Cambaridae"
    },
    realWeight: "~10 - 30 g",
    size: "8 - 12 cm",
    characteristics: "Thân hình tôm sông đặc trưng với hoa văn vân đá (marble pattern) màu nâu xanh lục óng ánh trên lớp giáp. Hai càng sắc nhọn kích thước trung bình và các chân bò linh hoạt.",
    habitat: "Hồ nước ngọt, sông suối dòng chảy chậm, đầm lầy, ruộng lúa và các kênh rạch nhân tạo.",
    location: "Bắt nguồn từ Đức (trong giới sinh vật cảnh thập niên 1990), hiện đã xâm lấn rộng khắp châu Âu, Madagascar và nhiều nước châu Á.",
    survival_method: "Khả năng sinh sản bùng nổ vượt trội so với tôm thường, nhanh chóng áp đảo các loài tôm bản địa. Chịu đựng cực tốt các biến động môi trường như ô nhiễm nước, thiếu oxy và sự thay đổi nhiệt độ đột ngột.",
    unique_traits: "Loài giáp xác mười chân duy nhất được biết đến sinh sản hoàn toàn vô tính bằng cơ chế trinh sản. Toàn bộ quần thể toàn cầu là một dòng vô tính đơn nhất của một cá thể cái đột biến ban đầu.",
    shortDescription: "Dòng vô tính tự nhân bản vô hạn. Kẻ xâm lấn trinh sản thống trị đầm lầy.",
    description: "Tôm Hùm Đất Tự Nhân Bản (Procambarus virginalis), hay Marmorkrebs, là một hiện tượng tiến hóa kỳ lạ bậc nhất thế kỷ 20. Chúng không tồn tại trong tự nhiên trước những năm 1990, mà xuất hiện thông qua một đột biến di truyền tam bội (triploid mutation) ngẫu nhiên của loài tôm Procambarus fallax trong bể nuôi cảnh ở Đức. Đột biến này mang lại cho chúng 3 bộ nhiễm sắc thể thay vì 2, kèm theo khả năng sinh sản không cần con đực. Chỉ cần một con tôm thoát ra ngoài tự nhiên, nó có thể tự đẻ hàng trăm trứng và nhân bản thành một đội quân xâm lấn khổng lồ, đe dọa trực tiếp đa dạng sinh học của các hệ sinh thái nước ngọt toàn cầu.",
    stats: {
      strength: 35,
      durability: 40,
      speed: 50,
      weaponry: 65,
      special: 98,
      lethality: 45
    },
    p4pScore: 50,
    tier: "C",
    strengths: [
      "Khả năng sinh sản vô tính bùng nổ cực nhanh không phụ thuộc việc tìm bạn tình",
      "Khả năng thích nghi môi trường cực tốt, sống sót cả trong nước bị ô nhiễm nặng",
      "Độ đa dạng quần thể nhân bản nhanh giúp dễ dàng lấn át các loài bản địa",
      "Càng sắc nhọn hỗ trợ săn mồi và tranh giành lãnh thổ hiệu quả"
    ],
    weaknesses: [
      "Đa dạng di truyền bằng không (tất cả là bản sao giống hệt nhau), khiến cả quần thể cực kỳ dễ bị xóa sổ hàng loạt bởi một loại mầm bệnh đơn lẻ",
      "Kích thước nhỏ bé nên dễ làm thức ăn cho các loài cá lớn, chim nước và động vật ăn thịt lớn hơn",
      "Cạnh tranh tài nguyên gắt gao giữa chính các bản sao khi mật độ quá cao"
    ],
    funFacts: [
      "Vì tất cả Marmorkrebs đều là bản sao di truyền của nhau, chúng là đối tượng nghiên cứu hoàn hảo cho các nhà di truyền học và nghiên cứu ung thư để hiểu về cơ chế di căn và sự tăng trưởng dòng vô tính",
      "Liên minh Châu Âu (EU) đã ban hành lệnh cấm hoàn toàn việc sở hữu, buôn bán hoặc thả loài tôm này vào tự nhiên để bảo vệ hệ sinh thái thủy sinh",
      "Dù mới xuất hiện chưa đầy 30 năm, loài này đã di cư và thành lập các quần thể khổng lồ tại đảo Madagascar, đe dọa các loài tôm đặc hữu ở đây"
    ],
    sources: [
      {
        url: "https://doi.org/10.1038/s41559-018-0467-9",
        label: "Nature Ecology & Evolution - The genome of the self-cloning marbled crayfish"
      },
      {
        url: "https://www.science.org/content/article/an-aquarium-accident-may-have-given-this-crayfish-the-power-to-clone-itself-and-take-over-the-world",
        label: "Science - Aquarium accident creates self-cloning crayfish"
      }
    ],
    imageColor: "#2E5A88",
    diet_type: "omnivore",
    diet_items: [
      "thực vật thủy sinh",
      "cá nhỏ",
      "ấu trùng",
      "mảnh vụn hữu cơ"
    ],
    activity_pattern: "nocturnal",
    lifespan_min: 2,
    lifespan_max: 4,
    lifespan_unit: "years",
    reproduction_type: "asexual",
    reproduction_notes: "Sinh sản vô tính trinh sản (parthenogenesis). Không có con đực tồn tại. Mỗi con cái có thể tự tạo ra hàng trăm trứng tự thụ không cần thụ tinh, tất cả con con đều là dòng vô tính (clone) giống hệt mẹ về mặt di truyền.",
    locomotion: "hybrid",
    speed_max: 1.2,
    conservation_status: "LC",
    size_min_mm: 80.0,
    size_max_mm: 120.0,
    weight_avg_g: 20.0
  }
];

export function getCreatureById(id: string): Creature | undefined {
  return creatures.find((c) => c.id === id);
}

export function getTierColor(tier: Tier): string {
  const colors: Record<Tier, string> = {
    S: "#FF2D2D",
    A: "#FF8C00",
    B: "#FFD700",
    C: "#4CAF50",
    D: "#9E9E9E",
  };
  return colors[tier];
}

export function getStatLabel(key: keyof CreatureStats): string {
  const labels: Record<keyof CreatureStats, string> = {
    strength: "Sức Mạnh",
    durability: "Độ Bền",
    speed: "Tốc Độ",
    weaponry: "Vũ Khí",
    special: "Đặc Biệt",
    lethality: "Sát Thương",
  };
  return labels[key];
}

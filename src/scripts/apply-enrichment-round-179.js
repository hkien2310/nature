const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching target 5 creatures from database...");
  
  const ids = ["box-jellyfish", "superb-lyrebird", "trap-jaw-ant", "immortal-jellyfish", "olm"];
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*")
    .in("id", ids);

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  const enriched = creatures.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "box-jellyfish") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá nhỏ", "tôm nhỏ", "giáp xác nhỏ", "giun biển", "ấu trùng sinh vật biển"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Các cá thể sứa trưởng thành giải phóng tinh trùng và trứng vào vùng nước biển ven bờ để thụ tinh ngoài. Trứng sau khi thụ tinh phát triển thành ấu trùng planula tự do bơi lội, sau đó bám đáy tạo thành polyp tĩnh. Các polyp này nhân bản vô tính nảy chồi trước khi biến thái strobilation giải phóng sứa non ephyrae để phát triển thành dạng medusa trưởng thành.";
      newC.locomotion = "swim";
      newC.speed_max = 7.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 350.0;
      newC.weight_avg_g = 2000.0;

      newC.characteristics = appendClean(c.characteristics, "Mỗi nematocyst hoạt động giống như một chiếc kim tiêm siêu nhỏ hoạt động bằng áp suất thủy tĩnh cao (~150 atm) phóng ra chất độc trong vòng một phần triệu giây.");
      newC.survival_method = appendClean(c.survival_method, "Khi gặp bão hoặc sóng lớn biển động, chúng sẽ di chuyển xuống tầng nước sâu hơn để bảo vệ cơ thể mỏng manh.");
      newC.unique_traits = appendClean(c.unique_traits, "Chúng sở hữu các tế bào thần kinh pacemakers phân bố ở rìa chuông giúp kiểm soát nhịp bơi bóp cơ nhịp nhàng.");

      newC.strengths = appendUniqueString(newC.strengths, "Cơ chế kích hoạt nematocyst bằng áp suất thủy tĩnh cực nhanh (dưới 1 micro giây) xuyên qua da con mồi nhanh chóng.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng điều khiển nhịp bơi bóp cơ hiệu quả nhờ hệ thống pacemakers rìa chuông sứa.");
      newC.strengths = appendUniqueString(newC.strengths, "Bộ nọc độc chứa protein Porin (chironex porins) đâm thủng màng tế bào máu, giải phóng kali gây ngừng tim đột ngột.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nọc độc bị vô hiệu hóa nhanh bởi axit axetic (giấm ăn), làm đông tụ protein ngăn cản các nematocyst chưa phóng kích hoạt.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Phụ thuộc lớn vào điều kiện gió và dòng chảy ven bờ, dễ bị dạt vào bãi cát khô chết khi có bão lớn.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Nọc độc của sứa hộp Úc mạnh đến mức một cá thể trưởng thành có chứa đủ lượng độc tố để lấy mạng 60 người trưởng thành trong thời gian ngắn.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chúng có thói quen bơi chậm lại và bám xuống tầng đáy cát hoặc rễ cây đước ven bờ vào ban đêm để ngủ ngủ lịm tiết kiệm năng lượng.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0004509",
        "label": "PLoS ONE - Complete genome and venom composition of Chironex fleckeri"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.02450",
        "label": "Journal of Experimental Biology - Visual behavior and orientation in box jellyfish"
      });

    } else if (c.id === "superb-lyrebird") {
      newC.diet_type = "omnivore";
      newC.diet_items = ["kiến", "mối", "bọ cánh cứng", "nhện", "giun đất", "hạt cây", "ấu trùng côn trùng", "ốc sên nhỏ"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con trống dựng sàn diễn và xòe đuôi biểu diễn giả giọng tuyệt đỉnh để thu hút nhiều con cái. Sau khi giao phối, con mái tự xây tổ hình vòm có mái che trên mặt đất hoặc hốc cây thấp, tự ấp một quả trứng duy nhất trong 50 ngày và tự nuôi con non mà không có sự trợ giúp của con trống.";
      newC.locomotion = "hybrid";
      newC.speed_max = 25.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 800.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 950.0;

      newC.characteristics = appendClean(c.characteristics, "Cơ thịt đùi và cơ chân cực kỳ phát triển chiếm tỷ trọng lớn trong khối lượng cơ thể giúp chúng dễ dàng chạy luồn lách qua các rừng cây rậm rạp.");
      newC.survival_method = appendClean(c.survival_method, "Vào ban đêm, chúng nhảy lên đậu trên các cành cây cao để ngủ nhằm tránh các kẻ săn mồi mặt đất.");
      newC.unique_traits = appendClean(c.unique_traits, "Cho phép độc lập điều khiển hai bên khí quan để tạo ra các âm thanh đa âm song song và bắt chước mọi tiếng động nhân tạo lẫn tự nhiên.");

      newC.strengths = appendUniqueString(newC.strengths, "Độc lập điều hòa dòng khí qua cơ quan phát âm (syrinx) phức tạp để tạo ra hai âm thanh khác nhau cùng lúc.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng ghi nhớ thính giác dài hạn siêu việt, giữ lại các âm thanh nhân tạo từ nhiều năm trước trong ký ức.");
      newC.strengths = appendUniqueString(newC.strengths, "Hành vi tạo đồi đất làm 'sân khấu' có tác dụng cộng hưởng âm học, giúp tiếng hót vang xa trong bán kính 1 km.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Cơ ngực phục vụ cho việc bay (cơ nâng cánh) kém phát triển khiến chúng không thể thực hiện các chuyến bay đường dài.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Lông đuôi của con trống quá lớn và cồng kềnh trong mùa sinh sản, làm giảm tính linh động khi chạy trốn trong rừng dày.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chúng có khả năng bắt chước tiếng kêu cứu hoảng loạn của cả một bầy chim khác khi có kẻ ăn thịt đến gần để dụ các con chim khác đến hỗ trợ hoặc làm nhiễu loạn kẻ thù.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Tiếng hót giả của chim cầm điểu đực thậm chí còn bắt chước được cả tiếng vỗ cánh của các loài chim khác với tần số cực kỳ chính xác.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2011.0722",
        "label": "Proceedings of the Royal Society B - Vocal mimicry in songbirds and the evolution of syrinx"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1007/s10071-021-01550-y",
        "label": "Animal Cognition - Structural learning and vocal mimicry in Menura novaehollandiae"
      });

    } else if (c.id === "trap-jaw-ant") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["mối", "ruồi", "nhện nhỏ", "các loài côn trùng nhỏ khác", "ấu trùng"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Giống như hầu hết các loài kiến xã hội, kiến chúa giao phối với kiến đực trong chuyến bay sinh sản (nuptial flight). Kiến chúa sau đó tự rụng cánh, đào tổ và đẻ trứng để thiết lập một thuộc địa mới. Trứng nở thành ấu trùng, phát triển thành nhộng và lột xác thành kiến thợ vô tính.";
      newC.locomotion = "walk";
      newC.speed_max = 3.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 8.0;
      newC.size_max_mm = 14.0;
      newC.weight_avg_g = 0.012;

      newC.characteristics = appendClean(c.characteristics, "Cặp hàm này được giữ ở trạng thái căng như lò xo nhờ một nhóm cơ khép hàm (plastoelastic structures) khổng lồ chiếm tới 50% thể tích hộp sọ.");
      newC.survival_method = appendClean(c.survival_method, "Nếu gặp kẻ thù lớn, chúng gõ hàm xuống mặt đất tạo lực đẩy phản hồi để bật người lên không trung thoát hiểm hoặc tấn công chéo.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thần kinh của chúng sử dụng đường dẫn khổng lồ (giant neurons) giúp truyền tín hiệu phản xạ đớp từ lông cảm giác đến cơ hàm chỉ trong vòng dưới 10 mili giây. Sử dụng lực đập hàm bật nhảy thoát hiểm khẩn cấp (jaw-jumping) vượt chướng ngại vật.");

      newC.strengths = appendUniqueString(newC.strengths, "Hệ thống nọc độc formic acid nồng độ cao nằm ở ngòi chích bụng hỗ trợ tê liệt con mồi sau cú đớp.");
      newC.strengths = appendUniqueString(newC.strengths, "Sợi neuron khổng lồ (giant sensory neurons) truyền dẫn xung thần kinh phản xạ siêu tốc không qua não bộ.");
      newC.strengths = appendUniqueString(newC.strengths, "Vỏ kitin được gia cố hàm lượng canxi cao ở vùng khớp đầu-cổ để hấp thụ chấn động phản lực từ cú đớp.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Cơ chế khóa hàm nhạy cảm có thể bị đánh lừa bởi bụi cát mịn hoặc các hạt thực vật rơi trúng trigger hairs, gây hao phí thế năng cơ học.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nếu bị ướt hoặc dính nước mưa nặng hạt, lực cản nước trên hàm sẽ làm giảm đáng kể tốc độ và hiệu suất đớp mồi.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Trứng và ấu trùng của loài kiến này có các sợi lông móc đặc biệt giúp chúng dính chặt vào nhau và vào tường hang để tránh bị lũ cuốn trôi.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Khi kiến chúa Odontomachus chết, một số kiến thợ có thể phát triển cơ quan sinh sản và đẻ trứng chưa thụ tinh để sinh ra kiến đực nhằm duy trì một phần gen.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.02022",
        "label": "Journal of Experimental Biology - Kinematics of jaw-jumping in Odontomachus bauri"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/een.12645",
        "label": "Ecological Entomology - Foraging patterns and colony size of trap-jaw ants"
      });

    } else if (c.id === "immortal-jellyfish") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["sinh vật phù du", "trứng cá", "giáp xác nhỏ", "ấu trùng thủy sinh"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 999;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Các cá thể Medusa đực và cái phóng thích tinh trùng và trứng vào biển. Sau khi thụ tinh, trứng phát triển thành ấu trùng planula tự do bơi lội, bám vào giá thể đáy tạo thành cụm polyp. Khi gặp stress môi trường, dạng medusa trải qua đảo ngược vòng đời để quay lại trạng thái polyp vô tính, từ đó nảy chồi ra hàng loạt medusae mới có hệ gen giống hệt nhau.";
      newC.locomotion = "swim";
      newC.speed_max = 0.1;
      newC.conservation_status = "LC";
      newC.size_min_mm = 4.5;
      newC.size_max_mm = 5.0;
      newC.weight_avg_g = 1.5;

      newC.characteristics = appendClean(c.characteristics, "Sở hữu hệ protein chống oxy hóa SIRT1 (sirtuin 1) và các con đường truyền tín hiệu Wnt/beta-catenin được duy trì ở mức độ biểu hiện ổn định cao ngay cả khi cơ thể bắt đầu thoái hóa ngược.");
      newC.survival_method = appendClean(c.survival_method, "Kích hoạt cơ chế autophagy (tự thực) chọn lọc để tiêu biến các tế bào xúc tu già cỗi và cơ quan tiêu hóa không cần thiết, tái chế axit amin để xây dựng lại tế bào biểu bì của dạng polyp non.");
      newC.unique_traits = appendClean(c.unique_traits, "Quá trình transdifferentiation của chúng không phụ thuộc vào sự phân chia tế bào liên tục mà thông qua việc lập trình lại biểu sinh (epigenetic reprogramming) xóa bỏ các dấu ấn metyl hóa DNA của trạng thái biệt hóa cũ.");

      newC.strengths = appendUniqueString(newC.strengths, "Khả năng tái lập trình biểu sinh tự nhiên nhanh chóng mà không gây tích lũy đột biến ung thư (malignant transformation).");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng duy trì cấu trúc telomere siêu ổn định thông qua cơ chế kéo dài telomere thay thế (ALT) kết hợp với hoạt tính telomerase mạnh mẽ.");
      newC.strengths = appendUniqueString(newC.strengths, "Cơ chế tự thực (autophagy) chọn lọc cao giúp tiêu biến và tái hấp thu hiệu quả các cơ quan già cỗi để làm nguyên liệu xây dựng tế bào non.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng chịu đựng sự thay đổi nồng độ muối (độ mặn) và nhiệt độ trong phạm vi rộng giúp tồn tại khi di chuyển xuyên đại dương.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Dạng polyp bám đáy cực kỳ dễ bị các sinh vật ăn đáy như ốc sên biển và cua nhỏ tàn phá trước khi có thể nảy chồi thành sứa mới.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Sự sụp đổ đột ngột nồng độ ion canxi (Ca2+) trong môi trường nước biển có thể làm tê liệt hoàn toàn cơ chế co bóp của Medusa và chặn đứng tín hiệu khởi động transdifferentiation.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Không có hệ thần kinh trung ương để chủ động phát hiện kẻ thù từ xa, phản xạ né tránh hoàn toàn phụ thuộc vào va chạm cơ học thụ động.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Khi sứa bất tử biến đổi ngược, các cụm tế bào của nó có khả năng tự tổ chức lại định hướng đầu-đuôi của polyp tương lai thông qua gradient nồng độ của protein BMP (Bone Morphogenetic Protein).");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Khi sứa bất tử biến đổi ngược, toàn bộ cơ thể của nó thu nhỏ lại thành một giọt gelatin gọi là cyst trước khi mọc ra mạng lưới stolon bám đáy để hình thành polyp mới.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Tất cả các cá thể sứa bất tử được phát hiện ở các đại dương xa xôi như Florida, Panama, Tây Ban Nha, Nhật Bản đều có bộ gene gần như giống hệt nhau, cho thấy chúng là những bản sao (clones) hoàn hảo được phát tán qua giao thông đường biển.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/acel.13702",
        "label": "Aging Cell - Molecular mechanisms of rejuvenation in Turritopsis dohrnii"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/mec.16910",
        "label": "Molecular Ecology - Genomics of life cycle reversal in Turritopsis dohrnii"
      });

    } else if (c.id === "olm") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["giáp xác nhỏ", "ốc sên hang", "ấu trùng côn trùng", "giun nước", "động vật không xương sống nhỏ"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 50;
      newC.lifespan_max = 100;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng. Con trống thiết lập lãnh thổ và tiết ra pheromone để dẫn dụ con cái. Con cái đẻ khoảng 30 đến 70 quả trứng dưới các phiến đá và bảo vệ chúng nghiêm ngặt trong suốt thời gian ấp từ 3 đến 6 tháng tùy theo nhiệt độ nước. Phải mất tới 14 năm để Olm đạt đến độ trưởng thành sinh dục.";
      newC.locomotion = "swim";
      newC.speed_max = 2.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 30.0;

      newC.characteristics = appendClean(c.characteristics, "Sở hữu hệ thống thụ cảm cơ học đường bên (lateral line system) cực kỳ nhạy bén, giúp vẽ bản đồ 3D của dòng nước hang ngầm và vật cản mà không cần ánh sáng. Cơ chế bảo vệ ADN siêu việt giúp chống chịu các tác động hóa học độc hại tích tụ trong nước hang động karst đóng kín.");
      newC.survival_method = appendClean(c.survival_method, "Sử dụng các enzyme chống oxy hóa nội sinh (như superoxide dismutase) và protein sốc nhiệt để bảo vệ cấu trúc tế bào khỏi bị tổn thương do gốc tự do trong suốt nhiều năm nhịn đói.");
      newC.unique_traits = appendClean(c.unique_traits, "Có khả năng tổng hợp nồng độ cao các acid béo không bão hòa đa (PUFAs) trong màng tế bào, giúp duy trì tính linh động của màng ở nhiệt độ nước hang ngầm không đổi quanh năm (khoảng 8-12°C).");

      newC.strengths = appendUniqueString(newC.strengths, "Sở hữu hệ thống thụ cảm cơ học đường bên (lateral line system) cực kỳ nhạy bén, giúp vẽ bản đồ 3D của dòng nước hang ngầm và vật cản mà không cần ánh sáng.");
      newC.strengths = appendUniqueString(newC.strengths, "Cơ chế bảo vệ ADN siêu việt giúp chống chịu các tác động hóa học độc hại tích tụ trong nước hang động karst đóng kín.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng duy trì độ nhạy cảm của các cơ quan thụ cảm điện (ampullae of Lorenzini-like) ngay cả trong điều kiện nồng độ khoáng chất trong hang ngầm sụt giảm nghiêm trọng.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng ức chế phản ứng viêm mãn tính thông qua biểu hiện mức độ cao của thụ thể glucocorticoid, kéo dài tuổi thọ tế bào cơ tim.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Lớp da mỏng mọc nhiều mao mạch để trao đổi khí rất nhạy cảm với sự ô nhiễm kim loại nặng hoặc thuốc bảo vệ thực vật thấm qua tầng đá vôi.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Tính biến động di truyền thấp do sống cô lập trong các hệ thống hang động khép kín khiến chúng dễ bị xóa sổ bởi dịch bệnh ngoại lai đột ngột.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Hệ thống miễn dịch thiếu khả năng đáp ứng thích ứng mạnh với các nấm ký sinh da (như Batrachochytrium dendrobatidis) do môi trường hang ngầm vô trùng tương đối.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Khi bị đưa ra ngoài ánh sáng mặt trời trong thời gian dài, da của Olm có thể dần phát triển sắc tố đen/nâu sẫm nhờ hoạt động của các tế bào melanophores tiềm ẩn, mặc dù mắt chúng vẫn mù.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Olm có thể nghe thấy các âm thanh tần số thấp dưới nước nhờ sự kết hợp đặc biệt giữa tai trong và các xương sọ nhạy cảm với rung động địa chấn.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Bộ gene khổng lồ của Olm chứa lượng lớn các nhân tố chuyển vị (retrotransposons) đã bị bất hoạt bởi cơ chế methyl hóa DNA chặt chẽ, ngăn chặn đột biến mất chức năng.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-020-64213-9",
        "label": "Scientific Reports - Genetic and genomic analysis of Proteus anguinus longevity"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.3389/fphys.2021.733612",
        "label": "Frontiers in Physiology - Metabolic and evolutionary adaptations in the cave salamander Proteus anguinus"
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Saved temporary enriched data to ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  console.log("\nEnrichment round completed successfully!");
}

run();

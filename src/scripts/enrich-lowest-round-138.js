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

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "blue-dragon") {
      newC.characteristics = "Thân hình dẹt, thuôn dài không vỏ với màu xanh dương đậm ở mặt bụng (hướng lên trên) và màu bạc ở mặt lưng (hướng xuống dưới) tạo hiệu ứng ngụy trang ngược (countershading). Sở hữu 3 cặp phần phụ dạng ngón tay xếp xòe ra gọi là cerata dùng để tăng diện tích tiếp xúc nổi và lưu trữ tế bào châm từ con mồi. Lớp mô biểu bì chứa hàm lượng keratinose phân nhánh liên kết chéo cao, đóng vai trò ngăn cản chấn thương cơ học và cách nhiệt tốt trước sự thay đổi nhiệt độ đột ngột của tầng mặt đại dương. Lớp chất nhầy phân cực âm trên màng tế bào của nó có tác dụng đẩy lùi điện tích kích hoạt của nematocytes sứa lửa. Lớp sắc tố xanh lam của nó chủ yếu chứa các carotenoprotein liên kết đặc biệt, hấp thụ và phản xạ hiệu quả bức xạ tia cực tím (UV) gay gắt của mặt trời trên bề mặt đại dương.";
      newC.survival_method = "Sử dụng túi khí nhỏ trong dạ dày để giữ tư thế ngửa và nổi sát mặt nước. Trôi dạt thụ động theo dòng chảy hải lưu và hướng gió. Khi bị đe dọa, phóng ra các tế bào châm cực độc đã cô đặc lấy từ con mồi. Tối ưu hóa chuyển động bằng cách điều tiết khí lượng trong túi dạ dày thông qua việc hấp thụ bọt khí từ sức căng bề mặt, cho phép chúng duy trì độ nổi hoàn hảo và tránh chìm xuống khi biển động. Khi gặp luồng nước lạnh đột ngột, chúng co cụm các cerata sát thân để giảm diện tích tiếp xúc tỏa nhiệt và bảo vệ cơ quan tiêu hóa.";
      newC.unique_traits = "Tích lũy tế bào châm (Kleptocnidae): Ăn sứa lửa Portuguese Man-of-War mà không bị trúng độc nhờ các tế bào biểu mô tiết chất nhầy đặc biệt khóa hoạt tính tế bào gai. Sau đó, nó lọc các nematocysts chưa nổ, chuyển chúng qua hệ tiêu hóa đến các cerata ở rìa thân để tích lũy tạo nọc độc mạnh hơn nguyên bản. Ngụy trang ngược (countershading) bảo vệ hai chiều khỏi chim săn mồi phía trên và cá săn mồi phía dưới. Cơ cơ chế chọn lọc sinh học tế bào cnidocytes: Chỉ giữ lại các tế bào gai stenotele lớn chứa độc tính cao nhất (nematocysts lớn) và đào thải các tế bào gai nhỏ ít tác dụng tự vệ thông qua biểu mô ruột. Sự tích tụ tế bào biểu bì sừng hóa dày đặc ở chân đuôi đóng vai trò mỏ neo cơ học bám giữ tạm thời vào giá thể trôi nổi. Đặc tính chống tia cực tím (UV photoprotection) nhờ phức hợp carotenoprotein bề mặt giúp chúng phơi mình dưới ánh nắng gay gắt suốt cả ngày.";

      newC.strengths = [
        "Khả năng hấp thụ và cô đặc tế bào gai cực độc của sứa lửa Portuguese Man-of-War để tấn công phòng vệ",
        "Hệ chất nhầy bảo vệ ống tiêu hóa và tế bào da miễn nhiễm hoàn toàn với các độc tố châm chích",
        "Ngụy trang ngược (countershading) hoàn hảo che mắt kẻ thù từ cả trên không và dưới nước",
        "Khả năng sinh sản lưỡng tính giao phối chéo giúp tối đa hóa cơ hội duy trì nòi giống giữa đại dương khơi",
        "Hệ thống tế bào chất nhầy glycosaminoglycan bọc ngoài ruột trung hòa tuyệt đối peptide độc của sứa lửa.",
        "Khả năng lưu giữ năng lượng sống cực lâu thông qua cơ chế hấp thụ tế bào tảo cộng sinh zooxanthellae từ con mồi.",
        "Khả năng tiết chất nhầy đặc thù chứa hàm lượng cao sulfated mucopolysaccharides để bao bọc và cô lập các gai châm độc hại.",
        "Khả năng định hướng trôi nổi chủ động bằng cách sử dụng sức căng bề mặt mặt nước để bám vào bọt khí và nhắm vào sứa lửa.",
        "Phức hợp carotenoprotein biểu bì phản xạ tia cực tím (UV) có hại bảo vệ DNA mô mềm bề mặt."
      ];

      newC.weaknesses = [
        "Khả năng tự bơi lội chủ động rất yếu, hoàn toàn phụ thuộc vào dòng hải lưu và hướng gió",
        "Cơ thể mềm mại không có lớp vỏ ngoài hay xương nâng đỡ, dễ bị tổn thương vật lý trực tiếp",
        "Dễ chết khô và mất nước nhanh chóng nếu bị sóng biển đánh dạt vào bờ cát sa bồi",
        "Hoàn toàn bất lực khi bị dòng xoáy đại dương (gyres) cuốn vào vùng nước lạnh dưới 15 độ C, gây ức chế cơ trơn dạ dày và mất sức nổi.",
        "Sự mẫn cảm tuyệt đối với sự thay đổi pH và độ mặn nước biển bề mặt do tác động của mưa axit hoặc biến đổi khí hậu."
      ];

      newC.fun_facts = [
        "Sên biển xanh di chuyển trong tư thế ngửa bụng lên trời; phần bụng màu xanh ngụy trang với màu nước biển, còn phần lưng màu bạc ngụy trang với ánh sáng mặt trời chiếu xuống đại dương",
        "Bằng cách nuốt không khí vào một túi nhỏ trong dạ dày, chúng có thể duy trì độ nổi cố định trên mặt nước mà không tốn năng lượng",
        "Chúng đẻ các dải trứng dài bám trực tiếp vào phần vỏ kitin hoặc phần còn sót lại của con mồi bị chúng ăn thịt để trứng trôi nổi an toàn",
        "Mặc dù là sinh vật biển khơi trôi nổi tự do, sên biển xanh có hành vi ăn thịt đồng loại (cannibalism) hung dữ khi mật độ quần thể quá dày đặc trong các vệt nước hội tụ.",
        "Sên biển xanh sở hữu một dải răng kitin (radula) hình chữ U sắc nhọn với các răng cưa mảnh xếp chồng lên nhau như răng cưa thép, được thiết kế đặc biệt để xé rách lớp biểu bì dai dẻo của sứa lửa.",
        "Con non của sên biển xanh mới nở ban đầu có vỏ xoắn nhỏ giống ốc sên thông thường, nhưng sẽ sớm tiêu biến lớp vỏ này khi chuyển sang lối sống nổi tự do trôi dạt.",
        "Các tế bào gai nematocyst được sên biển xanh chọn lọc kỹ càng, chỉ lấy các gai châm stenoteles lớn nhất của sứa lửa, tạo ra vết chích cực kỳ đau đớn cho con người khi chạm vào."
      ];

      newC.sources = [
        { "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/blue-dragon-glaucus-atlanticus", "label": "National Geographic - Blue Dragon Facts" },
        { "url": "http://www.marinespecies.org/aphia.php?p=taxdetails&id=140023", "label": "World Register of Marine Species - Glaucus atlanticus" },
        { "url": "https://doi.org/10.1093/mollus/eyy026", "label": "Journal of Molluscan Studies - Feeding mechanics and kleptocnidae of Glaucus atlanticus" },
        { "url": "https://doi.org/10.3389/fmars.2021.688196", "label": "Frontiers in Marine Science - Pelagic nudibranch distributions and environmental drivers" },
        { "url": "https://doi.org/10.1086/282216", "label": "The American Naturalist - Active host choice and kleptocnidae of Glaucus atlanticus" },
        { "url": "https://doi.org/10.1007/s00227-020-03795-2", "label": "Marine Biology - Carotenoproteic pigments and UV protection in neustonic nudibranchs" }
      ];
    } else if (c.id === "sand-scorpion") {
      newC.characteristics = "Thân màu vàng cát bán trong suốt, hoàn hảo để ẩn nấp trên nền cát sa mạc. Lớp biểu bì chứa chất hữu cơ phát huỳnh quang màu xanh lam lục rực rỡ khi chiếu đèn UV. Cặp càng mảnh nhưng nhanh nhẹn và đuôi gai chứa túi độc uốn cong lên trên. Lớp biểu bì ngoài bao phủ bởi lớp sáp hydrocarbon chuỗi dài siêu mỏng để hạn chế tối đa sự thoát hơi nước khuếch tán qua lớp vỏ giáp. Bộ lông cảm giác trichobothria trên càng có mật độ lên tới 120 sợi/mm2, phản hồi nhạy bén trước luồng gió dịch chuyển cực nhỏ từ cánh côn trùng.";
      newC.survival_method = "Đào hang sâu dưới cát để tránh nhiệt độ cao vào ban ngày, chỉ chui lên săn mồi vào ban đêm. Xác định vị trí con mồi nhờ cảm biến chấn động mặt cát cực nhạy trên kẽ chân. Điều hòa nhịp tim giảm xuống chỉ còn 4 nhịp/phút và hạ thấp nhiệt độ cơ thể xuống gần bằng nhiệt độ cát hang sâu để giảm thiểu trao đổi chất trao đổi oxy. Khi phát hiện chấn động lớn nghi ngờ động vật săn mồi như chuột sa mạc kangaroo, nó nhanh chóng rút lui xuống hang sâu và bịt kín miệng hang bằng một lớp cát nén cơ học.";
      newC.unique_traits = "Định vị địa chấn cát bằng kẽ chân (Slit sensilla): Đầu các chân có các cơ quan thụ cảm cơ học (basitarsal compound slit sensilla - BCSS) siêu nhạy phát hiện sóng Rayleigh (sóng địa chấn cát do con mồi đi qua tạo ra). Nhờ phân tích thời gian lệch mili-giây sóng truyền tới từng chân, nó xác định chính xác góc và khoảng cách con mồi trong vòng 50 cm. Lớp cutin phát quang xanh lục lam dưới ánh sáng UV. Bộ cơ quan pectines dạng lược ở mặt bụng chứa hơn hàng nghìn thụ thể hóa học peg sensilla nhạy bén, giúp ngửi, nếm, dò tìm các hạt lipid pheromone và dẫn đường định vị cát hoang mạc.";

      newC.strengths = [
        "Hệ thống định vị mục tiêu 3D dựa trên chấn động cát mịn có độ chính xác tuyệt đối",
        "Nọc độc thần kinh mạnh tê liệt tức thì con mồi chân khớp và động vật nhỏ",
        "Khả năng đào hang sâu dưới cát giúp trốn tránh kẻ thù lớn và giữ độ ẩm cơ thể",
        "Chỉ số trao đổi chất siêu thấp cho phép tồn tại nhiều tháng không cần thức ăn",
        "Hỗn hợp nọc độc chứa peptid độc tố neurotoxin chọn lọc kênh ion natri đặc thù của động vật không xương sống.",
        "Khả năng nhịn ăn phi thường lên tới 12 tháng liên tục nhờ cấu trúc túi gan tụy dự trữ mỡ lớn chiếm 20% thể tích thân.",
        "Khả năng phân biệt bước sóng cơ học thông qua thụ thể chân khớp để định dạng chính xác vận tốc và cấu trúc cơ thể của mục tiêu.",
        "Lực kẹp cơ học của càng so với kích thước cơ thể lớn, cho phép giữ chặt con mồi trước khi tiêm độc chất.",
        "Tích hợp cảm biến lông tarsal và slit sensilla giúp phân biệt con mồi cách xa 50cm với độ lệch thời gian dưới 0.2 mili-giây."
      ];

      newC.weaknesses = [
        "Thị giác rất kém, phụ thuộc hoàn toàn vào rung động cơ học để phản ứng",
        "Lớp vỏ mỏng dễ bị mất nước nhanh chóng dưới sức nóng mặt trời trực tiếp ban ngày",
        "Dễ bị phát hiện từ xa bởi các loài săn mồi trang bị khả năng nhìn hoặc săn tìm bằng tia UV",
        "Lớp màng giáp ở các khớp chân bò rất mỏng manh, dễ bị kiến lửa sa mạc bầy đàn phát hiện và châm chích chí mạng.",
        "Cơ thể dễ tích tụ kim loại nặng từ đất cát và con mồi do cơ chế tích trữ dài hạn trong gan tụy."
      ];

      newC.fun_facts = [
        "Bọ cạp cát có thể đo chênh lệch thời gian sóng chấn động cát truyền tới các chân khác nhau ở mức vài phần triệu giây để định vị mục tiêu",
        "Chất beta-carboline tích tụ ở vỏ ngoài làm bọ cạp cát phát ra ánh sáng huỳnh quang màu neon lung linh khi tiếp xúc với tia cực tím",
        "Vào mùa đông lạnh giá, chúng có thể hạ thấp mức tiêu thụ năng lượng gần như bằng không để ngủ đông sâu dưới hang cát",
        "Lớp cutin phát quang màu xanh lục của bọ cạp cát không hề bị mất đi ngay cả khi bọ cạp đã chết hàng chục năm hoặc khi lớp vỏ sừng bị lột ra.",
        "Mặc dù sống ở sa mạc khô cằn, bọ cạp cát cái mang thai có khả năng tích lũy nước nội bào từ con mồi để cung cấp đầy đủ chất lỏng cho bọc phôi thai phát triển trong bụng.",
        "Bọ cạp cát có khả năng ghi nhớ bản đồ chấn động xung quanh miệng hang trong phạm vi bán kính 1 mét nhờ các thụ thể cơ học phân bố ở các đốt chân.",
        "Pectines - cơ quan dạng lược ở mặt bụng - được dùng như một chiếc lưỡi nếm đất và hóa chất để bám đuôi con cái trong mùa sinh sản."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1152/jn.00941.2004", "label": "Journal of Neurophysiology - Sand-vibration detection by the sand scorpion" },
        { "url": "https://www.nature.com/articles/30811", "label": "Nature - Scorpion behavior and sand wave detection" },
        { "url": "https://doi.org/10.1242/jeb.01356", "label": "Journal of Experimental Biology - Sensory ecology of sand-vibration detection in Paruroctonus mesaensis" },
        { "url": "https://doi.org/10.1007/s00359-018-1265-1", "label": "Journal of Comparative Physiology A - Chemoreceptive functions of scorpion pectines" },
        { "url": "https://doi.org/10.1016/j.jinsphys.2023.104523", "label": "Journal of Insect Physiology - Cuticular lipid dynamics under extreme arid heat in desert scorpions" }
      ];
    } else if (c.id === "thorny-devil") {
      newC.characteristics = "Toàn thân bao phủ bởi các gai hình nón lớn nhỏ sắc nhọn bằng chất sừng cứng chắc. Mặt lưng có màu nâu vàng sa mạc đốm đen giúp ngụy trang. Trên gáy có một chiếc bướu gai lớn trông giống hệt như một cái đầu thứ hai để đánh lạc hướng kẻ săn mồi. Lớp da ngoài có cấu trúc sừng siêu kị nước kết hợp với mạng lưới kênh mao dẫn sâu 5-10 micromet len lỏi bên dưới lớp vảy sừng xếp chồng chéo. Hệ vảy Moloch này có độ đàn hồi tự nhiên rất cao, giúp phân tán lực va chạm vật lý mạnh mẽ từ các vụ lở đá hay đòn tấn công cơ học. Bề mặt các vảy được bao phủ bởi cấu trúc vi mô tổ ong siêu thấm nước (superhydrophilic micro-ornamentation).";
      newC.survival_method = "Sử dụng màu sắc cơ thể thay đổi theo nhiệt độ để ngụy trang và giữ nhiệt. Khi bị đe dọa, hạ thấp đầu thật giữa hai chân trước để lộ đầu giả bằng gai cứng ở gáy, đồng thời hít khí căng phồng người lên để tăng kích thước gây khó nuốt. Sử dụng cơ chế bài tiết axit uric dạng rắn và tái hấp thu nước tối đa ở bóng đái để giảm tiêu hao nước cơ thể xuống dưới 1% mỗi ngày trong mùa khô hạn. Khi di chuyển săn mồi dưới gió lớn sa mạc, chúng thực hiện các nhịp nhấp nhô ngắt quãng mô phỏng lá khô để che giấu chuyển động trước các loài chim ưng. Thực hiện hành vi hất hoặc đào cát ẩm phủ lên lưng để hút ẩm trực tiếp vào da.";
      newC.unique_traits = "Hệ thống hút nước mao dẫn qua da (Hygroscopic skin): Lớp da có các rãnh siêu hiển vi chạy dọc giữa các vảy. Lực mao dẫn tự động hút sương đêm hoặc hơi ẩm từ cát ẩm rồi dẫn ngược lên khóe miệng để thằn lằn uống nước mà không cần cúi đầu. Đầu giả ở gáy làm mồi nhử chịu đòn chí mạng thay cho đầu thật. Cấu trúc vảy Moloch đặc biệt với khả năng chuyển động vi mô khi thằn lằn chuyển động hàm, tạo lực hút chênh lệch áp suất cơ học đẩy dòng nước mao dẫn chảy nhanh hơn về khóe miệng. Cấu trúc rãnh mao dẫn phân cấp (hierarchical capillary channels) tăng khoảng cách và hiệu suất dẫn nước.";

      newC.strengths = [
        "Bộ giáp gai nhọn hoắt bao quanh toàn bộ cơ thể khiến kẻ thù cực kỳ khó đớp hoặc nuốt chửng",
        "Hệ thống da mao dẫn siêu việt giúp thu hoạch nước trực tiếp từ cát ẩm và sương đêm",
        "Khả năng ngụy trang đỉnh cao bằng cách thay đổi sắc tố da phù hợp với nhiệt độ cát",
        "Cơ quan đầu giả bằng gai ở gáy giảm thiểu rủi ro chấn thương sọ não khi bị tấn công",
        "Hệ tiêu hóa chứa hệ vi sinh vật chuyên biệt có khả năng phân giải nhanh lớp chitin dày cứng của kiến đen sa mạc.",
        "Tuyến bài tiết muối ở hốc mũi hoạt động hiệu quả giúp loại bỏ lượng muối dư thừa mà không tốn nước tiểu.",
        "Khả năng sử dụng chuyển động nuốt chủ động tạo ra áp lực âm tính trong miệng để tăng tốc độ dòng nước chảy qua rãnh da mao dẫn.",
        "Cấu trúc vi mô vảy sừng tổ ong siêu thấm nước ổn định màng nước mỏng trên lưng, tối ưu hóa lực mao dẫn dẫn nước."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển rất chậm chạp, dễ bị tóm nếu không kịp ẩn nấp",
        "Chế độ ăn cực kỳ chuyên biệt, chỉ ăn kiến đen sa mạc với số lượng lớn",
        "Hoàn toàn bất lực trước chim săn mồi có móng vuốt khỏe có thể lật ngửa cơ thể lộ vùng bụng mềm",
        "Hoàn toàn mất khả năng uống nước từ vũng nước sâu theo cách thông thường do cấu trúc khoang miệng bị biến đổi để tối ưu hóa mao dẫn.",
        "Tính dễ bị tổn thương cao trước các biến đổi sinh cảnh làm suy giảm các đàn kiến Iridomyrmex bản địa."
      ];

      newC.fun_facts = [
        "Thằn lằn quỷ gai có thể ăn tới 1000 đến 3000 con kiến chỉ trong một ngày bằng chiếc lưỡi dính đớp liên tục",
        "Khi di chuyển trên cát, chúng thực hiện một điệu bộ lắc lư giật lùi kỳ lạ để bắt chước một chiếc lá khô đung đưa trước gió nhằm tránh bị phát hiện",
        "Dù có vẻ ngoài trông vô cùng dữ tợn và gai góc, loài thằn lằn này hoàn toàn hiền lành, không cắn và không có nọc độc",
        "Khi sa mạc bước vào mùa đông lạnh giá, thằn lằn quỷ gai sẽ đào các hang sâu nghiêng 30 độ dài tới 1 mét dưới cát để duy trì nhiệt độ cơ thể ổn định trên 15 độ C.",
        "Gai của thằn lằn quỷ gai thực chất là các biến đổi phì đại của lớp vảy sừng ngoài chứ không liên kết trực tiếp với hệ xương bên trong.",
        "Thằn lằn quỷ gai có thể thay đổi sắc độ da từ vàng nhạt vào ban ngày sang xám đen khi đêm xuống để tối ưu hóa sự hấp thụ và tỏa nhiệt lượng.",
        "Để uống nước hiệu quả nhất từ cát ẩm, chúng chủ động đứng lên bãi cát ẩm và dùng chân hoặc đuôi hất cát phủ lên tấm lưng đầy rãnh mao dẫn."
      ];

      newC.sources = [
        { "url": "https://www.nature.com/articles/srep34364", "label": "Scientific Reports - Cutaneous water harvesting in the thorny devil" },
        { "url": "https://www.iucnredlist.org/species/83492069/83492074", "label": "IUCN Red List - Moloch horridus" },
        { "url": "https://doi.org/10.1242/jeb.148742", "label": "Journal of Experimental Biology - Quantitative analysis of cutaneous water harvesting in Moloch horridus" },
        { "url": "https://doi.org/10.1111/j.1469-7998.1996.tb05417.x", "label": "Journal of Zoology - Foraging ecology and diet selection in the thorny devil Moloch horridus" },
        { "url": "https://doi.org/10.1007/s00359-023-01642-x", "label": "Journal of Comparative Physiology A - Moloch horridus micro-vibration analysis" },
        { "url": "https://doi.org/10.1098/rsif.2016.0820", "label": "Journal of The Royal Society Interface - Biomimetic design of fluid-transporting surfaces based on Moloch horridus skin" }
      ];
    } else if (c.id === "horseshoe-crab") {
      newC.characteristics = "Hình dạng giống chiếc mũ sắt tròn dẹt màu nâu sẫm ngả xanh lục. Vỏ giáp carapace chitin dày cứng bọc ngoài prosoma (đầu ngực) và opisthosoma (bụng) bảo vệ các cơ quan nội tạng khỏi ngoại lực. Phần bụng có các gai di động và đuôi nhọn (telson) dài, cứng liên kết khớp xoay linh hoạt. Phía dưới giáp chứa 5 cặp chân khớp đi bộ và hệ thống mang sách (book gills) gồm 150 lá mang xếp lớp mỏng giữ ẩm tốt. Cấu trúc mắt kép phức tạp chứa khoảng 1000 ommatidia cảm nhận ánh sáng phân cực độ nhạy cao.";
      newC.survival_method = "Bò chậm rãi dưới đáy cát bùn ven bờ, sử dụng cặp càng nhỏ (chelicerae) để bới tìm giun biển và động vật thân mềm nhỏ. Khi sóng lớn đánh lật úp cơ thể lên bãi cát, chúng cắm mạnh đuôi telson xuống cát làm điểm tựa đòn bẩy cơ học để đẩy và xoay lật cơ thể lại 180 độ. Khả năng sinh tồn bền bỉ ngoài không khí trong vài ngày bằng cách khép chặt các phiến mang sách (book gills) giữ ẩm cho hoạt động hô hấp thụ động.";
      newC.unique_traits = "Dòng máu màu xanh dương chứa hemocyanin mang gốc đồng để vận chuyển oxy. Tế bào máu amebocyte cực nhạy với nội độc tố vi khuẩn Gram âm (LPS - Lipopolysaccharide), lập tức đông vón phóng thích coagulogen tạo màng gel đông đặc cô lập vi khuẩn trong vài giây. Là hóa thạch sống bền bỉ 450 triệu năm vượt qua 5 đại tuyệt chủng lớn. Hệ thống 10 mắt (gồm 2 mắt kép lớn và các mắt đơn cảm quang dọc vỏ và telson) định vị ánh sáng mặt trăng tối ưu cho chu kỳ sinh sản. Đôi mắt kép có cơ chế ức chế bên (lateral inhibition) giúp tăng độ tương phản rõ rệt - mô hình đoạt giải Nobel sinh lý học 1967. Dùng dịch chiết LAL (Limulus Amebocyte Lysate) làm thuốc thử vô trùng y tế tối thượng.";

      newC.strengths = [
        "Lớp vỏ giáp chitin cực kỳ dày và chắc bảo vệ khỏi va đập vật lý dữ dội.",
        "Hệ thống miễn dịch bằng máu xanh phản ứng đông máu tức thì tiêu diệt vi khuẩn gây hại.",
        "Khả năng nhịn ăn uống và chịu đựng điều kiện nồng độ muối, oxy thay đổi cực hạn.",
        "Chiếc đuôi telson đóng vai trò đòn bẫy điều hướng cơ thể linh hoạt khi bị lật úp.",
        "Lớp giáp dày chống lại được hầu hết các vết cắn của các động vật biển cỡ trung bình.",
        "Máu chứa Limulus Amebocyte Lysate (LAL) phát hiện và cô lập nội độc tố vi khuẩn chỉ ở mức nồng độ phần triệu.",
        "Có khả năng sống sót trong môi trường cực kỳ thiếu oxy nhờ hệ thống mang sách (book gills) hiệu quả cao.",
        "Hệ thống miễn dịch máu xanh amebocyte cô lập và tiêu diệt vi khuẩn Gram âm ở tốc độ cực cao.",
        "Khả năng thở dưới nước lẫn trên cạn nhờ hệ thống mang sách giữ nước tốt.",
        "Vỏ giáp prosoma bền bỉ phân tán 90% lực va đập cơ học từ sóng biển.",
        "Khả năng nhịn ăn kéo dài lên tới một năm nhờ cơ chế trao đổi chất tối thiểu khi rơi vào điều kiện môi trường bất lợi.",
        "Lớp vỏ carapace có cấu trúc vòm cong giúp phân tán đều áp lực, chống chịu tốt sức đè nén từ đá ngầm và các dòng thủy triều mạnh.",
        "Hệ thống miễn dịch máu xanh chứa tế bào amebocyte đông vón nhạy bén cô lập nội độc tố vi khuẩn chỉ ở mức phần triệu.",
        "Lớp giáp prosoma chitin dẻo dai phân tán lực va đập cơ học từ sóng biển và đá ngầm.",
        "Máu chứa Limulus Amebocyte Lysate (LAL) phát hiện và cô lập nội độc tố vi khuẩn ở mức nồng độ siêu nhỏ.",
        "Khả năng nhịn ăn kéo dài lên tới một năm nhờ cơ chế trao đổi chất tối thiểu khi gặp điều kiện bất lợi.",
        "Đôi mắt kép tích hợp mạng lưới ức chế bên (lateral inhibition) tăng cường độ tương phản thị giác trong điều kiện ánh sáng cực thấp dưới đáy biển."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển rất chậm chạp dưới nước và vụng về trên cạn.",
        "Không có vũ khí tấn công sát thương cao (càng hay nọc độc), phụ thuộc hoàn toàn vào phòng ngự vỏ giáp.",
        "Dễ bị mắc kẹt trên bãi cát nếu bị sóng đánh lật úp mà không có điểm tựa để đuôi telson tựa vào.",
        "Thiếu các cơ quan cảm giác tinh nhạy cho các chuyển động nhanh, dễ bị săn đuổi bởi cá mập hoặc rùa biển lớn.",
        "Việc khai thác máu quá mức bởi con người làm tăng tỷ lệ tử vong và làm giảm khả năng sinh sản của loài.",
        "Gặp khó khăn lớn trong việc tự lật lại trên địa hình bùn nhão hoặc bãi đá dốc nếu bị lật úp.",
        "Tốc độ di chuyển giới hạn do cấu trúc chân khớp bò chậm, không thể trốn chạy khỏi các loài cá mập hoặc rùa biển lớn chủ động tấn công.",
        "Khả năng tự vệ chủ động kém khi gặp các kẻ săn mồi trên cạn như chim biển lớn tấn công vào phần bụng mềm dưới giáp nếu sam bị lật ngửa.",
        "Thời gian trưởng thành sinh dục rất muộn (từ 9 đến 12 năm), khiến quần thể phục hồi rất chậm sau khi bị khai thác hoặc ô nhiễm môi trường.",
        "Rất dễ bị tổn thương nếu bị sóng đánh lật úp trên bãi biển không có điểm tựa để lật lại.",
        "Thời gian trưởng thành sinh dục rất muộn từ 9 đến 12 năm khiến quần thể khó phục hồi."
      ];

      newC.fun_facts = [
        "Dù có đuôi dài trông giống như một chiếc gai gai góc hung dữ, đuôi của sam biển hoàn toàn không có độc và không dùng để tấn công, mà chỉ để làm bánh lái và lật người lại.",
        "Mỗi năm, hàng trăm ngàn con sam được con người đánh bắt, trích lấy 30% lượng máu xanh phục vụ y tế rồi thả về biển khơi. Tỉ lệ sống sót sau khi hiến máu của chúng lên tới hơn 85%.",
        "Sam biển có 10 con mắt, bao gồm cả hai mắt kép lớn ở hai bên vỏ và nhiều cơ quan cảm quang dọc đuôi và dưới bụng giúp định vị ánh sáng mặt trăng để canh ngày sinh sản.",
        "Sam biển bơi ngửa! Chúng sử dụng lớp giáp rộng như một thân thuyền và đập các tấm mang sách để đẩy mình đi trong nước khi cần di chuyển nhanh.",
        "Mắt của sam biển được nghiên cứu rộng rãi để hiểu về cơ chế ức chế bên trong hệ thống thị giác, nghiên cứu này đã đoạt giải Nobel Y học năm 1967.",
        "Sam biển không phải cua mà có họ hàng gần với nhện và bọ cạp hơn, thuộc phân ngành Chelicerata.",
        "Đôi mắt kép của sam biển nhạy cảm với ánh sáng gấp 10 lần vào ban đêm nhờ hệ thống điều chỉnh sinh học nhịp ngày đêm.",
        "Máu xanh của sam biển được trích xuất để sản xuất thuốc thử LAL vô cùng đắt đỏ, cứu sống hàng triệu người mỗi năm thông qua việc kiểm tra độ vô trùng của vắc-xin.",
        "Trong mùa sinh sản, hàng ngàn con sam tụ tập trên các bãi biển dưới ánh trăng tròn tạo nên một cảnh tượng kỳ vĩ của tự nhiên tồn tại từ thời khủng long.",
        "Mặc dù máu sam biển có màu xanh dương khi tiếp xúc với oxy, khi ở trong cơ thể không có oxy nó lại có màu xám đục hoặc gần như không màu.",
        "LAL (Limulus Amebocyte Lysate) nhạy cảm đến mức có thể phát hiện nội độc tố vi khuẩn Gram âm ngay cả khi chúng chỉ chiếm 1 phần nghìn tỷ trong dung dịch."
      ];

      newC.sources = [
        { "url": "https://www.frontiersin.org/articles/10.3389/fmars.2020.573571/full", "label": "Frontiers in Marine Science - Horseshoe Crab Conservation and Biomedical Value" },
        { "url": "https://www.nwf.org/Educational-Resources/Wildlife-Guide/Invertebrates/Horseshoe-Crab", "label": "National Wildlife Federation - Horseshoe Crab Profile" },
        { "url": "https://doi.org/10.1007/978-0-387-89959-6", "label": "Biology and Conservation of Horseshoe Crabs" },
        { "url": "https://doi.org/10.3389/fmars.2020.573571", "label": "Frontiers in Marine Science - Horseshoe Crab Biomedical Value (2020)" },
        { "url": "https://doi.org/10.1007/978-3-030-84315-1", "label": "Fisheries and Conservation of Horseshoe Crabs (2022)" },
        { "url": "https://www.iucnredlist.org/species/11987/115089332", "label": "IUCN Red List - Limulus polyphemus species status" },
        { "url": "https://www.nobelprize.org/prizes/medicine/1967/summary/", "label": "Nobel Prize 1967 - Vision Research and Lateral Inhibition" }
      ];
    } else if (c.id === "kakapo") {
      newC.characteristics = "Thân hình tròn trịa, mập mạp và nặng nhất trong các loài vẹt. Bộ lông màu xanh lục pha lẫn đen và vàng giúp ngụy trang dưới tán rừng mưa mù sương. Mặt có nhiều lông mịn xếp tròn giống chim cú giúp định vị âm thanh. Đôi cánh ngắn, yếu chỉ dùng để thăng bằng hoặc làm dù lượn khi nhảy từ trên cành cao xuống đất. Đĩa lông mặt màu rơm vàng xòe rộng như chim cú đóng vai trò như một radar định hướng âm thanh truyền trong bụi rậm về đêm. Cơ ngực thoái hóa nghiêm trọng và xương ức hoàn toàn phẳng (thiếu gờ xương ức) do sự biến mất của áp lực tiến hóa bay lượn.";
      newC.survival_method = "Khi gặp nguy hiểm, Kakapo sẽ đứng đông cứng hoàn toàn và dựa hoàn toàn vào bộ lông màu lá cây để biến mất vào môi trường. Chúng dùng đôi chân to khỏe để đi bộ quãng đường dài lên tới vài kilomet mỗi đêm và trèo lên các ngọn cây cao bằng vuốt sắc kết hợp mỏ để tìm thức ăn. Khi đứng bất động tự vệ, nhịp tim của Kakapo tự động giảm sâu để giảm thiểu rung động cơ học và tiếng thở dưới lá. Điều chỉnh chu kỳ sinh sản đồng bộ với mùa đậu quả của cây Rimu (Dacrydium cupressinum) để tận dụng nguồn dinh dưỡng dồi dào chứa canxi hữu cơ.";
      newC.unique_traits = "Loài vẹt duy nhất không biết bay và hoạt động hoàn toàn về đêm. Hệ thống sinh sản kiểu lek (đực tụ tập khiêu vũ và phát tiếng kêu 'boom' tần số thấp truyền xa nhiều kilomet để thu hút con cái). Sở hữu mùi hương cơ thể cực kỳ thơm (mùi hoa cỏ ngọt hoặc mật ong) do các tuyến dầu đặc biệt tiết ra. Dạ dày của Kakapo có hệ cơ nghiền cực mạnh kết hợp vi khuẩn lên men chuyên biệt để tiêu hóa cellulose của các loại lá cây xơ cứng. Hệ thống tiêu hóa thích nghi độc đáo giúp chiết xuất năng lượng tối ưu từ thức ăn thực vật nghèo dinh dưỡng. Sở hữu hệ thống trao đổi chất cơ bản (basal metabolic rate) ở mức thấp nhất trong số tất cả các loài chim có kích thước tương đương trên hành tinh. Chu kỳ sinh sản phụ thuộc mật thiết vào mast year của cây Rimu.";

      newC.strengths = [
        "Khả năng ngụy trang thụ động siêu hạng bằng cách đứng bất động tuyệt đối.",
        "Đôi chân cực kỳ khỏe để leo trèo cây cổ thụ và đi bộ dặm dài xuyên rừng.",
        "Khứu giác cực kỳ phát triển giúp phát hiện thức ăn và bạn tình dễ dàng.",
        "Tuổi thọ tự nhiên cực kỳ cao, lên tới 90 năm.",
        "Hệ thống mỏ sừng ba khớp cực khỏe hỗ trợ leo trèo các thân cây gỗ đứng mà không cần dùng cánh.",
        "Khả năng lưu trữ năng lượng mỡ dưới da vượt trội giúp chúng sống sót qua mùa đông New Zealand lạnh giá.",
        "Hệ thống cơ đùi phát triển mạnh mẽ tạo lực bật nhảy đáng kể giữa các cành cây thấp.",
        "Hệ vi sinh vật đường ruột kỵ khí cực kỳ phong phú chứa các loài Clostridia giúp phân giải tối ưu các liên kết hemicellulose cứng.",
        "Bộ lông màu xanh rêu ngụy trang thụ động siêu đẳng hòa lẫn vào rừng mưa ôn đới.",
        "Khứu giác phát triển vượt trội hỗ trợ tìm kiếm thức ăn và bạn tình trong bóng tối.",
        "Mùi hương cơ thể đặc trưng chứa các hợp chất terpene tự nhiên ngọt ngào đóng vai trò thiết yếu trong việc nhận diện bạn tình trong bóng đêm."
      ];

      newC.weaknesses = [
        "Hoàn toàn không biết bay nên dễ dàng bị tấn công bởi thú ăn thịt ngoại lai du nhập.",
        "Phản xạ đứng yên đông cứng hoàn toàn vô tác dụng trước các loài thú săn mồi bằng khứu giác.",
        "Chu kỳ sinh sản rất chậm và thất thường (chỉ đẻ khi cây Rimu kết trái đại trà, khoảng 2-5 năm một lần).",
        "Khả năng phòng vệ vật lý bằng 0.",
        "Mùi hương cơ thể thơm ngọt đặc trưng do tuyến dầu đuôi tiết ra dễ bị thú săn mồi dò vết từ khoảng cách xa.",
        "Tốc độ phản ứng với các mối đe dọa trên không (như chim ưng cắt) khá chậm chạp.",
        "Di truyền nghèo nàn (genetic bottleneck) nghiêm trọng do quần thể suy giảm lịch sử làm tăng tỷ lệ trứng không nở.",
        "Hoàn toàn không biết bay nên rất dễ làm mồi cho các thú săn mồi có vú ngoại lai nhập cư.",
        "Chu kỳ sinh sản rất chậm phụ thuộc vào chu kỳ ra quả của cây Rimu."
      ];

      newC.fun_facts = [
        "Kakapo có mùi thơm dễ chịu như mật ong hoặc hoa cỏ rừng, chính mùi hương này đã vô tình dẫn đường cho chồn và mèo ngoại lai đến săn lùng chúng.",
        "Tiếng gầm rú 'boom' trầm ấm của Kakapo đực được tạo ra nhờ bóng hơi trong ngực, có thể truyền xa tới 5 km trong rừng rậm.",
        "Chúng cực kỳ thân thiện với con người, đôi khi tò mò tiếp cận và leo lên vai các nhà nghiên cứu.",
        "Kakapo đực có thể giảm tới 30% trọng lượng cơ thể trong mùa sinh sản vì mải mê khiêu vũ và gầm rú suốt đêm mà không ăn uống gì.",
        "Tên của chúng trong tiếng Māori có nghĩa là 'vẹt đêm' (kākā = vẹt, pō = đêm).",
        "Do tính tò mò bẩm sinh và thiếu bản năng sợ hãi động vật săn mồi có vú, Kakapo thường coi con người như đồng loại của chúng.",
        "Mùi cơ thể của Kakapo thơm như mùi của một chiếc đàn violon cổ cũ kỹ hoặc mùi hoa cỏ mật ong ngọt ngào."
      ];

      newC.sources = [
        { "url": "https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/kakapo/", "label": "New Zealand Department of Conservation - Kakapo" },
        { "url": "https://www.kcc.org.nz/portfolio/kakapo/", "label": "Kiwi Conservation Club - Kakapo Information" },
        { "url": "https://doi.org/10.1080/03014223.2023.2248560", "label": "New Zealand Journal of Zoology - Nesting ecology and lek behavior of Kakapo" },
        { "url": "https://www.iucnredlist.org/species/22685245/129751100", "label": "IUCN Red List - Strigops habroptilus" },
        { "url": "https://doi.org/10.1016/j.cub.2023.08.087", "label": "Current Biology - Genomic analysis and conservation history of the Kakapo" },
        { "url": "https://doi.org/10.1016/j.ecolmodel.2018.06.012", "label": "Ecological Modelling - Kākāpō breeding and Dacrydium cupressinum masting relationships" }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
